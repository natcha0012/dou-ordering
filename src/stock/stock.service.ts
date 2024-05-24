import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { ListStockBranchMasterRes } from './dto/response.dto';
import { AddStockReq, updateBranchStockReq } from './dto/request.dto';
import { InjectQueue } from '@nestjs/bull';
import { STOCK_QUEUE } from 'src/constants/queue';
import { Queue } from 'bull';
import { AddStockJob } from 'src/queue/stock.consumer';
import { ThaiDate } from 'src/utils';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(STOCK_QUEUE) private readonly stockQueue: Queue<AddStockJob>,
  ) {}

  async listStockReport(
    branchMasterId: number,
  ): Promise<ListStockBranchMasterRes[]> {
    const stock = await this.prisma.stock.findMany({
      select: {
        id: true,
        date: true,
        totalIn: true,
        totalOut: true,
        stockBalance: true,
        productId: true,
        productName: true,
        productTypeId: true,
        spoiledAmount: true,
      },
      where: { branchMasterId },
    });

    return stock.map((st) => {
      return {
        ...st,
        id: String(st.id),
      };
    });
  }

  async listStockByDate(branchMasterId: number, date: string) {
    const productType = await this.prisma.productType.findMany({
      orderBy: { id: 'asc' },
    });
    let isExist = true;
    const response = productType.map((pt) => {
      return {
        productType: pt.name,
        stocks: [],
      };
    });
    const checkStock = await this.prisma.stock.findFirst({
      select: { id: true },
      where: { branchMasterId, date },
    });
    if (!checkStock) {
      const checkDate = await this.prisma.stock.findFirst({
        select: { date: true },
        where: { branchMasterId, date: { lt: date } },
        orderBy: { date: 'desc' },
      });

      if (!checkDate) {
        const products = await this.prisma.product.findMany({
          orderBy: { productTypeId: 'asc' },
        });
        products.map((p) => {
          response[p.productTypeId - 1].stocks.push({
            id: '0',
            date,
            totalIn: 0,
            totalOut: 0,
            stockBalance: 0,
            productId: p.id,
            productName: p.name,
            spoiledAmount: 0,
            productTypeId: p.productTypeId,
          });
        });
        return response;
      } else {
        date = checkDate.date;
        isExist = false;
      }
    }
    const stock = await this.prisma.stock.findMany({
      select: {
        id: true,
        date: true,
        totalIn: true,
        totalOut: true,
        stockBalance: true,
        productId: true,
        productName: true,
        spoiledAmount: true,
        productTypeId: true,
      },
      where: { branchMasterId, date },
      orderBy: [{ productTypeId: 'asc' }, { productId: 'asc' }],
    });
    stock.forEach((st) => {
      const item = isExist
        ? { ...st, id: String(st.id) }
        : {
            ...st,
            id: String(st.id),
            totalIn: 0,
            totalOut: 0,
            spoiledAmount: 0,
          };
      response[st.productTypeId - 1].stocks.push(item);
    });
    return response;
  }

  async createNewDayStock(branchMasterId: number) {
    const stock = await this.prisma.stock.findMany({
      where: {
        branchMasterId,
      },
      orderBy: { date: 'desc' },
      distinct: ['productId'],
    });

    const today = ThaiDate();

    await this.prisma.stock.createMany({
      data: stock.map((st) => {
        return {
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
        };
      }),
    });
  }

  async addStock(input: AddStockReq): Promise<string> {
    const today = ThaiDate();
    let stock = await this.prisma.stock.findFirst({
      where: {
        branchMasterId: input.masterId,
        date: today,
        productId: input.productId,
      },
    });

    if (!stock) {
      await this.createNewDayStock(input.masterId);
      stock = await this.prisma.stock.findFirst({
        where: {
          branchMasterId: input.masterId,
          date: today,
          productId: input.productId,
        },
      });
    }
    this.stockQueue.add('add_stock', {
      ...input,
      productName: stock.productName,
      productTypeId: stock.productTypeId,
    });
    return 'add stock to queue success';
  }

  async listBranchStock(branchId: number) {
    const productType = await this.prisma.productType.findMany({
      orderBy: { id: 'asc' },
    });
    const response = productType.map((pt) => {
      return {
        productType: pt.name,
        stocks: [],
      };
    });
    const checkStock = await this.prisma.branchStock.findFirst({
      select: { id: true },
      where: { branchId },
    });
    if (!checkStock) {
      throw new HttpException(
        'Cannot Get Branch Stock',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const stock = await this.prisma.branchStock.findMany({
      select: {
        id: true,
        productId: true,
        productName: true,
        amount: true,
        productTypeId: true,
      },
      where: { branchId },
      orderBy: [{ productTypeId: 'asc' }, { productId: 'asc' }],
    });
    stock.forEach((st) => {
      const item = { ...st, id: String(st.id) };
      response[st.productTypeId - 1].stocks.push(item);
    });
    return response;
  }

  async updateBranchStock(branchId: number, input: updateBranchStockReq) {
    console.log('todo update branchStock', branchId, input);
    return;
  }
}
