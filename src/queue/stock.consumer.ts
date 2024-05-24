import {
  OnGlobalQueueCompleted,
  OnGlobalQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { STOCK_QUEUE } from 'src/constants/queue';
import { QueueStatus } from 'src/enum/queue.enum';
import { OrderDetail } from 'src/order/dto/request.dto';
import { Prisma, PrismaService } from 'src/prisma';
import { ThaiDate } from 'src/utils';

export type AddStockJob = {
  masterId: number;
  productId: number;
  add: number;
  productName: string;
  productTypeId: number;
};

type StockAmount = {
  amount: number;
  stockId: number;
};

export type PlaceOrderJob = {
  orderId: number;
  readyToPack: StockAmount[];
};

export type AdjustOrderJob = {
  orderId: number;
  reserveStock: StockAmount[];
  retrieveStock: StockAmount[];

  orderDetails: OrderDetail[];
  totalBalance: Prisma.Decimal;
};

@Processor(STOCK_QUEUE)
export class StockConsumer {
  constructor(private readonly prisma: PrismaService) {}

  @Process('add_stock')
  async addStock(job: Job<AddStockJob>) {
    const now = ThaiDate();
    const data = job.data;
    try {
      const stock = await this.prisma.stock.update({
        where: {
          branchMasterId_date_productId: {
            branchMasterId: data.masterId,
            date: now,
            productId: data.productId,
          },
        },
        data: {
          totalIn: { increment: data.add },
          stockBalance: { increment: data.add },
        },
      });
      delete stock.id;
      return stock;
    } catch (err) {
      Logger.error(err, 'ADD_STOCK');
      throw new Error(
        JSON.stringify({
          jobId: String(job.id),
          jobName: 'add_stock',
        }),
      );
    }
  }

  // don't aggregrate place_order and adjust_order
  // because it's easier to read
  @Process('place_order')
  async readyToPack(job: Job<PlaceOrderJob>) {
    const data = job.data;
    try {
      const sqlReadyTopacks = data.readyToPack.map(
        (st) => `${st.amount}|${st.stockId}`,
      );
      await this.prisma
        .$executeRaw`CALL update_stock_place_order(${sqlReadyTopacks.join(
        '##',
      )}, ${data.orderId})`;
      return { orderId: String(data.orderId), jobName: 'place_order' };
    } catch (err) {
      Logger.error(err, 'PLACE_ORDER');
      throw new Error(
        JSON.stringify({
          orderId: String(data.orderId),
          jobName: 'place_order',
        }),
      );
    }
  }

  @Process('adjust_order')
  async AdjustOrder(job: Job<AdjustOrderJob>) {
    const data = job.data;
    try {
      const sqlReserveStock = data.reserveStock.map(
        (st) => `${st.amount}|${st.stockId}`,
      );

      const sqlRetrieveStock = data.retrieveStock.map(
        (st) => `${st.amount}|${st.stockId}`,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`CALL update_stock_adjust_order(${sqlReserveStock.join(
          '##',
        )}, ${sqlRetrieveStock.join('##')})`;
        await tx.order.update({
          where: { id: data.orderId },
          data: {
            orderDetail: data.orderDetails as any[],
            balance: data.totalBalance,
            queueStatus: QueueStatus.IN_PROGRESS,
          },
        });
      });
      return { orderId: String(data.orderId), jobName: 'adjust_order' };
    } catch (err) {
      Logger.error(err, 'ADJUST_ORDER');
      throw new Error(
        JSON.stringify({
          orderId: String(data.orderId),
          jobName: 'adjust_order',
        }),
      );
    }
  }

  @OnGlobalQueueCompleted()
  async onGlobalCompleted(jobId: number, result: any) {
    Logger.log(`job ${jobId} -> result:  ${result}`, '(Global) on completed');
    const res = JSON.parse(result);
    if (res.orderId) {
      await this.prisma.order.update({
        where: { id: Number(res.orderId) },
        data: { queueStatus: QueueStatus.DONE },
      });
    }
  }

  @OnGlobalQueueFailed()
  async onGlobalFailed(jobId: number, result: any) {
    Logger.error(`job ${jobId} -> result:  ${result}`, '(Global) on failed');
    const res = JSON.parse(result);
    if (res.orderId) {
      await this.prisma.order.update({
        where: { id: Number(res.orderId) },
        data: { queueStatus: QueueStatus.FAILED },
      });
    }
  }
}
