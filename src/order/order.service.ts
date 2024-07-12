import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ActualOrderDetail,
  AddToCartReq,
  OrderDetail,
  ProductAmount,
  RemoveFromCartReq,
} from './dto/request.dto';
import { Order, Prisma, PrismaService } from 'src/prisma';
import { OrderStatus } from 'src/enum/order.enum';
import { UserTokenPayload } from 'src/types/token.type';
import { UserRole } from 'src/enum/user.enum';
import { ThaiDate } from 'src/utils';
import { ListOrderResponse, OrderResponse } from './dto/response.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async generateOrderDetail(input: AddToCartReq) {
    const orderDetails: OrderDetail[] = [];

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
        productTypeId: product.productTypeId,
      };
      orderDetails.push(orderDetail);
    }

    return orderDetails;
  }
  async addToCart(user: UserTokenPayload, input: AddToCartReq) {
    const orderDetails = await this.generateOrderDetail(input);
    const branch = await this.prisma.branch.findUnique({
      where: { id: user.branchId },
    });
    const orderBody: Prisma.OrderUncheckedCreateInput = {
      branchId: user.branchId,
      branchName: branch.name,
      branchMasterId: user.branchMasterId,
      orderDetail: orderDetails as any[],
      status: OrderStatus.IN_CART,
      createdBy: user.id,
    };
    const order = await this.prisma.order.create({ data: orderBody });
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
    orderDetails = orderDetails.filter(
      (or) => or.productId !== input.productId,
    );

    if (order.status === OrderStatus.IN_CART || OrderStatus.ORDER_PLACED) {
      await this.prisma.order.update({
        where: { id: input.orderId },
        data: { orderDetail: orderDetails as any[] },
      });
      return { status: 'success', msg: 'remove order success' };
    } else {
      return {
        status: 'fail',
        msg: 'order status should be incart or order place',
      };
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
    const orderDetails = await this.generateOrderDetail(input);

    if (
      order.status === OrderStatus.IN_CART ||
      order.status === OrderStatus.ORDER_PLACED
    ) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { orderDetail: orderDetails as any[] },
      });

      return { id: orderId };
    } else {
      throw new HttpException(
        'order status should be incart or order place',
        HttpStatus.BAD_REQUEST,
      );
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

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ORDER_PLACED },
    });

    return { id: orderId };
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

    //End: for store procedure
    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PACKING, packingId: userId },
    });
    delete res.id;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async confirmPacked(
    orderId: number,
    actualProducts: ProductAmount[],
    user: UserTokenPayload,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new HttpException('Order Not Found', HttpStatus.BAD_REQUEST);
    }

    if (user.role === UserRole.PACKING && order.packingId !== user.id) {
      throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
    }

    if (
      order.status !== OrderStatus.PACKING &&
      order.status !== OrderStatus.ORDER_PLACED
    ) {
      throw new HttpException(
        'Order Status Must Be Packing',
        HttpStatus.BAD_REQUEST,
      );
    }

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PACKED,
        actualProducts: actualProducts as any,
      },
    });
    delete res.id;
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

    const res = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });
    delete res.id;
    delete res.createdAt;
    delete res.updatedAt;
    return res;
  }

  async confirmOrder(
    orderId: number,
    actualProducts: ProductAmount[],
    user: UserTokenPayload,
  ) {
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
      // data: { status: OrderStatus.WAITING_FOR_PAYMENT },
      data: {
        status: OrderStatus.SUCCESS,
        actualProducts: actualProducts as any,
      },
    });
    delete res.id;
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

    type OrderDetailResp = {
      productId: number;
      productName: string;
      orderedAmount: number;
      actualAmount: number;
      remark: {
        masterRemark?: string;
        branchRemark?: string;
      };
    };

    const orderDetail = order.orderDetail as unknown as OrderDetail[];
    const actualDetail = order.actualProducts as unknown as ActualOrderDetail[];
    const orderDetailByProductTypeId: Record<number, OrderDetailResp[]> = {};

    const orderDetailByProductType: {
      productType: string;
      products: OrderDetailResp[];
    }[] = [];
    orderDetail.map((or) => {
      const { productTypeId, ...product } = or;

      const actualProduct = actualDetail.find(
        (or) => or.productId === product.productId,
      );
      const productDesc = {
        productId: product.productId,
        productName: product.productName,
        orderedAmount: product.amount,
        actualAmount: actualProduct?.amount ?? product.amount,
        remark: {
          masterRemark: actualProduct?.masterRemark,
          branchRemark: actualProduct?.branchRemark,
        },
      };

      if (!orderDetailByProductTypeId[productTypeId]) {
        orderDetailByProductTypeId[productTypeId] = [productDesc];
      } else {
        orderDetailByProductTypeId[productTypeId].push(productDesc);
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
      id: orderId,
      totalItems: actualDetail?.length ?? 0,
      orderDetail: orderDetailByProductType,
      createdAt: ThaiDate(Number(order.createdAt)),
      updatedAt: ThaiDate(Number(order.updatedAt)),
    };
  }

  async getOrderIncart(user: UserTokenPayload, id?: number) {
    let order: Order;
    if (id) {
      order = await this.prisma.order.findUnique({ where: { id } });
      if (order.createdBy !== user.id) {
        throw new HttpException('Permission Denied', HttpStatus.UNAUTHORIZED);
      }
    } else {
      order = await this.prisma.order.findFirst({
        where: { createdBy: user.id, status: OrderStatus.IN_CART },
      });
    }

    if (!order) {
      return { orderId: 0, detail: [] };
    }

    const orderDetail = order.orderDetail as unknown as OrderDetail[];
    return { orderId: String(order.id), detail: orderDetail };
  }
}
