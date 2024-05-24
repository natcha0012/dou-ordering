import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  AddToCartReq,
  OrderDetail,
  ProductProblem,
  RemoveFromCartReq,
  SpoiledProductDetail,
} from './dto/request.dto';
import { Decimal, Prisma, PrismaService } from 'src/prisma';
import { OrderStatus } from 'src/enum/order.enum';
import { UserTokenPayload } from 'src/types/token.type';
import { UserRole } from 'src/enum/user.enum';
import { InjectQueue } from '@nestjs/bull';
import { STOCK_QUEUE } from 'src/constants/queue';
import { Queue } from 'bull';
import { AdjustOrderJob, PlaceOrderJob } from 'src/queue/stock.consumer';
import { QueueStatus } from 'src/enum/queue.enum';
import { ThaiDate } from 'src/utils';
import { ListOrderResponse, OrderResponse } from './dto/response.dto';
import { StockService } from 'src/stock/stock.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(STOCK_QUEUE)
    private readonly stockQueue: Queue<PlaceOrderJob | AdjustOrderJob>,
    private readonly stockService: StockService,
  ) {}

  async generateOrderDetail(input: AddToCartReq) {
    const orderDetails: OrderDetail[] = [];
    let totalBalance = new Decimal(0);

    const productIds = input.orders.map((or) => or.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    for (const order of input.orders) {
      const product = products.find((p) => p.id == order.productId);
      if (!product) continue;
      const orderDetail: OrderDetail = {
        productId: product.id,
        productName: product.name,
        amount: order.amount,
        pricePerOne: product.price,
        productTypeId: product.productTypeId,
        balance: product.price.mul(order.amount),
      };
      totalBalance = totalBalance.plus(orderDetail.balance);
      orderDetails.push(orderDetail);
    }

    return { orderDetails, totalBalance };
  }
  async addToCart(user: UserTokenPayload, input: AddToCartReq) {
    const { orderDetails, totalBalance } =
      await this.generateOrderDetail(input);
    const orderBody: Prisma.OrderUncheckedCreateInput = {
      branchId: user.branchId,
      branchMasterId: user.branchMasterId,
      orderDetail: orderDetails as any[],
      status: OrderStatus.IN_CART,
      balance: totalBalance,
    };
    const order = await this.prisma.order.create({ data: orderBody });
    delete order.queueStatus;
    delete order.createdAt;
    delete order.updatedAt;
    return { ...order, id: String(order.id) };
  }

  async removeFromCart(input: RemoveFromCartReq, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (
      order.status !== OrderStatus.IN_CART &&
      order.status !== OrderStatus.ORDER_PLACED
    ) {
      throw new HttpException(
        'Order Is Already On Process',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.branchId !== order.branchId) {
      throw new HttpException(
        `Permission Denied: User Must Be in Branch Id ${order.branchId}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    let orderDetails = order.orderDetail as unknown as OrderDetail[];
    const removedProduct = orderDetails.find(
      (or) => or.productId === input.productId,
    );

    const totalBalance = order.balance.minus(removedProduct.balance);
    orderDetails = orderDetails.filter(
      (or) => or.productId !== input.productId,
    );

    if (order.status === OrderStatus.IN_CART) {
      await this.prisma.order.update({
        where: { id: input.orderId },
        data: { orderDetail: orderDetails as any[], balance: totalBalance },
      });
      return 'remove order success';
    }

    // deduct ready to pack in queue
    if (order.status === OrderStatus.ORDER_PLACED) {
      const today = ThaiDate();
      let stockId = 0;
      const stock = await this.prisma.stock.findUnique({
        where: {
          branchMasterId_date_productId: {
            branchMasterId: order.branchMasterId,
            date: today,
            productId: input.productId,
          },
        },
      });

      if (!stock) {
        await this.stockService.createNewDayStock(order.branchMasterId);
        const newStock = await this.prisma.stock.findUnique({
          where: {
            branchMasterId_date_productId: {
              branchMasterId: order.branchMasterId,
              date: today,
              productId: input.productId,
            },
          },
        });
        stockId = Number(newStock.id);
      } else {
        stockId = Number(stock.id);
      }

      const adjustBody: AdjustOrderJob = {
        orderId: Number(order.id),
        reserveStock: [],
        retrieveStock: [{ stockId, amount: removedProduct.amount }],
        orderDetails,
        totalBalance,
      };

      await this.stockQueue.add('adjust_order', adjustBody);

      return 'remove order is in queue';
    }
  }

  async adjustOrder(
    orderId: number,
    user: UserTokenPayload,
    input: AddToCartReq,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (user.branchId !== order.branchId) {
      throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
    }

    if (
      order.status !== OrderStatus.IN_CART &&
      order.status !== OrderStatus.ORDER_PLACED
    ) {
      throw new HttpException(
        'Order Is Already On Process',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { orderDetails, totalBalance } =
      await this.generateOrderDetail(input);

    if (order.status === OrderStatus.IN_CART) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { orderDetail: orderDetails as any[], balance: totalBalance },
      });

      return 'adjust order success';
    }

    // adjust ready to pack in queue
    if (order.status === OrderStatus.ORDER_PLACED) {
      const today = ThaiDate();
      // check order in stock
      const oldOrderDetail = order.orderDetail as unknown as OrderDetail[];
      const oldProductIds = oldOrderDetail.map((or) => or.productId);
      const newProductIds = input.orders.map((or) => or.productId);
      const productIds = new Set(oldProductIds.concat(newProductIds));
      const checkStock = await this.prisma.stock.findFirst({
        where: { branchMasterId: order.branchMasterId, date: today },
      });
      if (!checkStock) {
        await this.stockService.createNewDayStock(order.branchMasterId);
      }
      const stock = await this.prisma.stock.findMany({
        where: {
          branchMasterId: order.branchMasterId,
          date: today,
          productId: { in: [...productIds] },
        },
      });

      const adjustBody: AdjustOrderJob = {
        orderId,
        reserveStock: [],
        retrieveStock: [],
        orderDetails,
        totalBalance,
      };
      for (const st of stock) {
        const avaliableAmount = st.stockBalance - st.readyToPack;
        const orderAmount =
          input.orders.find((or) => or.productId === st.productId)?.amount ?? 0;

        if (orderAmount > avaliableAmount) {
          throw new HttpException(
            `Stock ${st.productName} Not Enough: order amount is ${orderAmount} but avaliable amount is ${avaliableAmount}`,
            HttpStatus.BAD_REQUEST,
          );
        }

        const oldOrderAmount =
          oldOrderDetail.find((or) => or.productId === st.productId)?.amount ??
          0;

        if (oldOrderAmount > orderAmount) {
          adjustBody.retrieveStock.push({
            stockId: Number(st.id),
            amount: oldOrderAmount - orderAmount,
          });
        } else if (oldOrderAmount < orderAmount) {
          adjustBody.reserveStock.push({
            stockId: Number(st.id),
            amount: orderAmount - oldOrderAmount,
          });
        }
      }

      await this.stockQueue.add('adjust_order', adjustBody);
      return 'adjust order is in queue';
    }
  }

  async placeOrder(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.IN_CART) {
      throw new HttpException(
        'Order Status Must Be In Cart',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.branchId !== order.branchId) {
      throw new HttpException(
        `Permission Denied: User Must Be in Branch Id ${order.branchId}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // check if stock have enough items
    const orderDetail = order.orderDetail as unknown as OrderDetail[];
    const productIds = orderDetail.map((or) => or.productId);

    const today = ThaiDate();
    const stock = await this.prisma.stock.findMany({
      where: {
        branchMasterId: order.branchMasterId,
        date: today,
        productId: { in: productIds },
      },
    });

    if (stock.length <= 0) {
      await this.stockService.createNewDayStock(order.branchMasterId);
    }

    const reserveBody: PlaceOrderJob = {
      orderId,
      readyToPack: [],
    };
    for (const st of stock) {
      const avaliableAmount = st.stockBalance;
      const orderAmount = orderDetail.find(
        (or) => or.productId === st.productId,
      ).amount;

      if (orderAmount > avaliableAmount) {
        throw new HttpException(
          `Stock ${st.productName} Not Enough: order amount is ${orderAmount} but avaliable amount is ${avaliableAmount}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (st.date !== today) {
        const newStock = await this.prisma.stock.create({
          data: {
            date: today,
            totalIn: 0,
            totalOut: 0,
            readyToPack: 0,
            stockBalance: st.stockBalance,
            productId: st.productId,
            productTypeId: st.productTypeId,
            productName: st.productName,
            branchMasterId: st.branchMasterId,
            spoiledAmount: 0,
          },
        });
        reserveBody.readyToPack.push({
          stockId: Number(newStock.id),
          amount: orderAmount,
        });
      } else {
        reserveBody.readyToPack.push({
          stockId: Number(st.id),
          amount: orderAmount,
        });
      }
    }

    //add ready to pack in queue
    await this.stockQueue.add('place_order', reserveBody);

    return { status: 'place order is in queue' };
  }

  async packOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.ORDER_PLACED) {
      throw new HttpException(
        'Order Status Must Be Order Placed',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.queueStatus === QueueStatus.FAILED) {
      throw new HttpException(
        'Internal Server Error: Contact Super Admin',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    //check if place order success
    if (order.queueStatus !== QueueStatus.DONE) {
      throw new HttpException('Order Is Not Ready Yet', HttpStatus.BAD_REQUEST);
    }

    const orderDetails = order.orderDetail as unknown as OrderDetail[];

    const today = ThaiDate();
    //Begin: for store procedure
    const productIds = orderDetails.map((or) => or.productId);
    const checkStock = await this.prisma.stock.findFirst({
      where: { branchMasterId: order.branchMasterId, date: today },
    });

    if (!checkStock) {
      await this.stockService.createNewDayStock(order.branchMasterId);
    }
    const stocks = await this.prisma.stock.findMany({
      where: {
        branchMasterId: order.branchMasterId,
        date: today,
        productId: { in: productIds },
      },
    });

    // create body should be empty array
    const createBody = [];
    const updateBody = [];
    for (const stock of stocks) {
      const ord = orderDetails.find((or) => or.productId == stock.productId);
      if (stock.date !== today) {
        createBody.push(
          `${today}|${0}|${ord.amount}|${stock.readyToPack - ord.amount}|${
            stock.stockBalance - ord.amount
          }|${stock.productId}|${stock.productName}|${
            stock.branchMasterId
          }|${0}`,
        );
      } else {
        updateBody.push(
          `${String(stock.id)}|${stock.totalOut + ord.amount}|${
            stock.readyToPack - ord.amount
          }|${stock.stockBalance - ord.amount}`,
        );
      }
    }

    const res = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`CALL update_stock_pack_order(${createBody.join(
        '##',
      )}, ${updateBody.join('##')})`;
      //End: for store procedure
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PACKING, packingId: userId },
      });
      delete order.id;
      delete order.queueStatus;
      delete order.createdAt;
      delete order.updatedAt;
      return order;
    });
    return res;
  }

  async confirmPacked(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (user.role === UserRole.PACKING && order.packingId !== user.id) {
      throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
    }

    if (order.status !== OrderStatus.PACKING) {
      throw new HttpException(
        'Order Status Must Be Packing',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PACKED },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async delivering(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.PACKED) {
      throw new HttpException(
        'Order Status Must Be Packed',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERING, deliverId: userId },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async delivered(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.DELIVERING) {
      throw new HttpException(
        'Order Status Must Be Delivering',
        HttpStatus.BAD_REQUEST,
      );
    }
    const orderDetails = order.orderDetail as unknown as OrderDetail[];
    const today = ThaiDate();
    //Begin: for store procedure
    const productIds = orderDetails.map((or) => or.productId);
    const mapBranchProducts = await this.prisma.mapBranchProduct.findMany({
      where: {
        branchId: order.branchId,
        productId: { in: productIds },
      },
      orderBy: { date: 'desc' },
      distinct: ['productId'],
    });

    const createBody = [];
    const updateBody = [];
    for (const branchProduct of mapBranchProducts) {
      const ord = orderDetails.find(
        (or) => or.productId == branchProduct.productId,
      );
      if (branchProduct.date !== today) {
        createBody.push(
          `${today}|${ord.amount}|${ord.productId}|${ord.productName}|${
            order.branchMasterId
          }|${order.branchId}|${
            branchProduct.allTimeAmount + BigInt(ord.amount)
          }`,
        );
      } else {
        updateBody.push(`${branchProduct.id}|${ord.amount}`);
      }
    }
    const res = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`CALL add_branch_product(${createBody.join(
        '##',
      )}, ${updateBody.join('##')})`;
      //End: for store procedure
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.DELIVERED },
      });
      delete order.id;
      delete order.queueStatus;
      delete order.createdAt;
      delete order.updatedAt;
      return order;
    });

    return res;
  }

  //allow staff to update order amount in the same order id
  async setProblem(
    orderId: number,
    input: ProductProblem,
    user: UserTokenPayload,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (user.role === UserRole.STAFF && order.branchId !== user.branchId) {
      throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
    }

    if (
      order.status !== OrderStatus.DELIVERED &&
      order.status !== OrderStatus.PRODUCT_PROBLEMS
    ) {
      throw new HttpException(
        'Order Status Must Be Delivered or ProductProblems',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.description.slice(0, 6) === 'claim:') {
      throw new HttpException(
        'First Word Should Not Be Claim',
        HttpStatus.BAD_REQUEST,
      );
    }

    const orderDetails = order.orderDetail as unknown as OrderDetail[];
    let totalBalance = order.balance;
    const spoiledProducts: SpoiledProductDetail[] = [];
    for (const spd of input.spoiledProducts) {
      const orderDetail = orderDetails.find(
        (or) => or.productId === spd.productId,
      );
      if (!orderDetail) {
        throw new HttpException('Invalid Product', HttpStatus.BAD_REQUEST);
      }
      if (orderDetail.amount < spd.amount) {
        throw new HttpException(
          `${orderDetail.productName} Must Less Than ${orderDetail.amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const pricePerOne = new Decimal(orderDetail.pricePerOne);
      const priceLoss = pricePerOne.mul(spd.amount);
      delete orderDetail.balance;
      spoiledProducts.push({
        ...orderDetail,
        amount: spd.amount,
        priceLoss,
      });
      totalBalance = totalBalance.minus(priceLoss);
    }

    if (order.status === OrderStatus.PRODUCT_PROBLEMS) {
      const oldSpoiledProducts =
        order.spoiledProducts as unknown as SpoiledProductDetail[];
      for (const pd of oldSpoiledProducts) {
        totalBalance = totalBalance.plus(pd.priceLoss);
      }
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        remark: input.description,
        spoiledProducts: spoiledProducts as any[],
        balance: totalBalance,
        status: OrderStatus.PRODUCT_PROBLEMS,
      },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async approveProblem(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (
      order.status !== OrderStatus.PRODUCT_PROBLEMS &&
      order.status !== OrderStatus.CLAIM
    ) {
      throw new HttpException(
        'Order Status Must Be Product Problems',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.role === UserRole.ADMIN &&
      order.branchMasterId !== user.branchMasterId
    ) {
      throw new HttpException(
        `Permission Denied: user should be in branch master id ${order.branchMasterId}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const today = ThaiDate();

    const checkStock = await this.prisma.stock.findFirst({
      where: {
        branchMasterId: order.branchMasterId,
        date: today,
      },
    });

    if (!checkStock) {
      await this.stockService.createNewDayStock(order.branchMasterId);
    }

    const spoiledProducts =
      order.spoiledProducts as unknown as SpoiledProductDetail[];
    const res = await this.prisma.$transaction(async (tx) => {
      for (const sp of spoiledProducts) {
        const stock = await tx.stock.findFirst({
          where: {
            branchMasterId: order.branchMasterId,
            date: today,
            productId: sp.productId,
          },
        });

        if (!stock) {
          throw new HttpException(
            'Internal Server Error: Stock Not Found',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const totalOut =
          order.status === OrderStatus.PRODUCT_PROBLEMS ? 0 : sp.amount;

        await tx.stock.update({
          where: { id: stock.id },
          data: {
            totalOut: { increment: totalOut },
            stockBalance: { decrement: totalOut },
            spoiledAmount: stock.spoiledAmount + sp.amount,
          },
        });
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status:
            order.status === OrderStatus.PRODUCT_PROBLEMS
              ? OrderStatus.WAITING_FOR_PAYMENT
              : OrderStatus.SUCCESS,
        },
      });
      delete updatedOrder.id;
      delete updatedOrder.queueStatus;
      delete updatedOrder.createdAt;
      delete updatedOrder.updatedAt;
      return updatedOrder;
    });
    return res;
  }

  async confirmOrder(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new HttpException(
        'Order Status Must Be Derivered',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.role === UserRole.STAFF && order.branchId !== user.branchId) {
      throw new HttpException(
        `Permission Denied: user should be in branch id ${order.branchId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.WAITING_FOR_PAYMENT },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async payBill(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (order.status !== OrderStatus.WAITING_FOR_PAYMENT) {
      throw new HttpException(
        'Order Status Must Be Waiting For Payment',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.role === UserRole.STAFF && order.branchId !== user.branchId) {
      throw new HttpException(
        `Permission Denied: user should be in branch id ${order.branchId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.WAITING_FOR_APPROVED },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async approvePayment(orderId: number, user: UserTokenPayload) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (
      order.status !== OrderStatus.WAITING_FOR_APPROVED &&
      order.status !== OrderStatus.CLAIM
    ) {
      throw new HttpException(
        'Order Status Must Be Waiting For Approve Or Claim',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.role === UserRole.ADMIN &&
      order.branchMasterId !== user.branchMasterId
    ) {
      throw new HttpException(
        `Permission Denied: user should be in branch master id ${order.branchMasterId}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SUCCESS },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async claimProducts(
    orderId: number,
    input: ProductProblem,
    user: UserTokenPayload,
  ) {
    //Validation
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (user.role === UserRole.STAFF && order.branchId !== user.branchId) {
      throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
    }

    if (
      order.status !== OrderStatus.SUCCESS &&
      order.status !== OrderStatus.CLAIM
    ) {
      throw new HttpException(
        'Order Status Must Be Success or Claim',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.status === OrderStatus.SUCCESS && order.remark) {
      throw new HttpException(
        'This Order Is Already Claim',
        HttpStatus.BAD_REQUEST,
      );
    }

    const orderDetails = order.orderDetail as unknown as OrderDetail[];
    const spoiledProducts: SpoiledProductDetail[] = [];

    // Begin Claim
    for (const spd of input.spoiledProducts) {
      const orderDetail = orderDetails.find(
        (or) => or.productId === spd.productId,
      );
      if (!orderDetail) {
        throw new HttpException('Invalid Product', HttpStatus.BAD_REQUEST);
      }
      if (orderDetail.amount < spd.amount) {
        throw new HttpException(
          `${orderDetail.productName} Must Less Than ${orderDetail.amount}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      delete orderDetail.balance;
      spoiledProducts.push({
        ...orderDetail,
        amount: spd.amount,
        priceLoss: new Decimal(0),
      });
    }
    if (input.description.slice(0, 6) !== 'claim:') {
      input.description = `claim: ${input.description}`;
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        remark: input.description,
        spoiledProducts: spoiledProducts as any[],
        status: OrderStatus.CLAIM,
      },
    });
    delete res.id;
    delete res.queueStatus;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  getNeedToActionStatus(role: UserRole) {
    switch (role) {
      case UserRole.ADMIN:
        return [
          OrderStatus.ORDER_PLACED,
          OrderStatus.PACKING,
          OrderStatus.WAITING_FOR_APPROVED,
        ];
      case UserRole.STAFF:
        return [OrderStatus.DELIVERED, OrderStatus.WAITING_FOR_PAYMENT];
      case UserRole.DELIVER:
        return [OrderStatus.PACKED, OrderStatus.DELIVERING];
      case UserRole.PACKING:
        return [OrderStatus.ORDER_PLACED, OrderStatus.PACKING];
      default:
        return [OrderStatus.ORDER_PLACED, OrderStatus.WAITING_FOR_APPROVED];
    }
  }

  getWatingStatus(role: UserRole) {
    switch (role) {
      case UserRole.ADMIN:
        return [
          OrderStatus.PACKED,
          OrderStatus.DELIVERING,
          OrderStatus.DELIVERED,
        ];
      case UserRole.STAFF:
        return [
          OrderStatus.ORDER_PLACED,
          OrderStatus.PACKING,
          OrderStatus.PACKED,
          OrderStatus.DELIVERING,
        ];
      case UserRole.DELIVER:
        return [OrderStatus.ORDER_PLACED, OrderStatus.PACKING];
      case UserRole.PACKING:
        return [];
      default:
        return [
          OrderStatus.PACKING,
          OrderStatus.PACKED,
          OrderStatus.DELIVERING,
          OrderStatus.DELIVERED,
        ];
    }
  }

  whereOrder(role: UserRole, branchMasterId?: number, branchId?: number) {
    switch (role) {
      case UserRole.ADMIN:
        return {
          branchMasterId: branchMasterId ?? undefined,
          status: { not: { in: [OrderStatus.SUCCESS, OrderStatus.IN_CART] } },
        };
      case UserRole.STAFF:
        return {
          branchId: branchId ?? undefined,
          status: { not: { in: [OrderStatus.SUCCESS] } },
        };
      case UserRole.DELIVER:
        return {
          status: {
            in: [
              OrderStatus.ORDER_PLACED,
              OrderStatus.PACKING,
              OrderStatus.PACKED,
              OrderStatus.DELIVERING,
              OrderStatus.DELIVERED,
            ],
          },
        };
      case UserRole.PACKING:
        return {
          status: {
            in: [
              OrderStatus.ORDER_PLACED,
              OrderStatus.PACKING,
              OrderStatus.PACKED,
            ],
          },
        };
      default:
        return {
          branchMasterId: branchMasterId ?? undefined,
          status: { not: { in: [OrderStatus.SUCCESS, OrderStatus.IN_CART] } },
        };
    }
  }

  async listOrder(user: UserTokenPayload): Promise<ListOrderResponse> {
    const orders = await this.prisma.order.findMany({
      select: {
        id: true,
        status: true,
        branchId: true,
        branchName: true,
        createdAt: true,
      },
      where: this.whereOrder(user.role, user.branchMasterId, user.branchId),
    });

    const issue: OrderResponse[] = [];
    const action: OrderResponse[] = [];
    const waiting: OrderResponse[] = [];
    let success: OrderResponse[] = [];
    if (user.role !== UserRole.PACKING && user.role !== UserRole.DELIVER) {
      const successOrders = await this.prisma.order.findMany({
        select: {
          id: true,
          status: true,
          branchId: true,
          branchName: true,
          createdAt: true,
        },
        where: {
          branchMasterId: user.branchMasterId ?? undefined,
          branchId: user.branchId ?? undefined,
          status: OrderStatus.SUCCESS,
        },
        take: 100,
      });
      success = successOrders.map((or) => {
        return {
          orderId: String(or.id),
          status: or.status as OrderStatus,
          date: ThaiDate(Number(or.createdAt)),
          branchId: or.branchId,
          branchName: or.branchName,
        };
      });
    }
    const actionStatus = this.getNeedToActionStatus(user.role);

    const waitingStatus = this.getWatingStatus(user.role);

    const issueStatus = [OrderStatus.CLAIM, OrderStatus.PRODUCT_PROBLEMS];

    for (const order of orders) {
      if (issueStatus.includes(order.status as OrderStatus)) {
        issue.push({
          orderId: String(order.id),
          status: order.status as OrderStatus,
          date: ThaiDate(Number(order.createdAt)),
          branchId: order.branchId,
          branchName: order.branchName,
        });
      } else if (actionStatus.includes(order.status as OrderStatus)) {
        action.push({
          orderId: String(order.id),
          status: order.status as OrderStatus,
          date: ThaiDate(Number(order.createdAt)),
          branchId: order.branchId,
          branchName: order.branchName,
        });
      } else if (waitingStatus.includes(order.status as OrderStatus)) {
        waiting.push({
          orderId: String(order.id),
          status: order.status as OrderStatus,
          date: ThaiDate(Number(order.createdAt)),
          branchId: order.branchId,
          branchName: order.branchName,
        });
      } else if (
        user.role === UserRole.PACKING ||
        user.role === UserRole.DELIVER
      ) {
        success.push({
          orderId: String(order.id),
          status: order.status as OrderStatus,
          date: ThaiDate(Number(order.createdAt)),
          branchId: order.branchId,
          branchName: order.branchName,
        });
      }
    }

    //TODO: may be remove waiting for frontend
    const all = issue.concat(action).concat(waiting).concat(success);
    return {
      all,
      issue,
      action,
      waiting,
      success,
    };
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
    });

    delete order.queueStatus;
    const orderDetail = order.orderDetail as unknown as OrderDetail[];
    const orderDetailByProductTypeId: Record<
      number,
      Omit<OrderDetail, 'productTypeId'>[]
    > = {};

    const orderDetailByProductType: {
      productType: string;
      products: Omit<OrderDetail, 'productTypeId'>[];
    }[] = [];
    orderDetail.map((or) => {
      const { productTypeId, ...product } = or;
      if (!orderDetailByProductTypeId[productTypeId]) {
        orderDetailByProductTypeId[productTypeId] = [product];
      } else {
        orderDetailByProductTypeId[productTypeId].push(product);
      }
    });
    const productTypeIds = Object.keys(orderDetailByProductTypeId).map((k) =>
      Number(k),
    );

    const productTypes = await this.prisma.productType.findMany({
      where: { id: { in: productTypeIds } },
    });

    productTypes.forEach((pt) => {
      orderDetailByProductType.push({
        productType: pt.name,
        products: orderDetailByProductTypeId[pt.id],
      });
    });

    return {
      ...order,
      balance: order.balance.toFixed(2),
      id: orderId,
      orderDetail: orderDetailByProductType,
      createdAt: ThaiDate(Number(order.createdAt)),
      updatedAt: ThaiDate(Number(order.updatedAt)),
    };
  }
}
