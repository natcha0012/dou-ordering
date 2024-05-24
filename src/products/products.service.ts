import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateProductReq,
  SetProductLimitReq,
  UpdateProductReq,
} from './dto/request.dto';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from 'src/prisma';
import { ThaiDate } from 'src/utils';
import { UserTokenPayload } from 'src/types/token.type';
import { UserRole } from 'src/enum/user.enum';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(input: CreateProductReq): Promise<Product> {
    const dupProduct = await this.prisma.product.findUnique({
      where: { name: input.name },
    });
    if (dupProduct) {
      throw new HttpException('Product Already Exist', HttpStatus.BAD_REQUEST);
    }

    const branchMasterIds = await this.prisma.branchMaster.findMany({
      select: { id: true },
    });
    const branchIds = await this.prisma.branch.findMany({});

    const response = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({ data: input });
      const mapBranchProduct: Prisma.MapBranchProductCreateManyInput[] = [];
      const limitProduct: Prisma.LimitProductCreateManyInput[] = [];
      const stock: Prisma.StockCreateManyInput[] = [];
      const branchStock: Prisma.BranchStockCreateManyInput[] = [];
      for (const branchMaster of branchMasterIds) {
        stock.push({
          date: ThaiDate(),
          branchMasterId: branchMaster.id,
          productId: product.id,
          productName: product.name,
          productTypeId: input.productTypeId,
          totalIn: 0,
          readyToPack: 0,
          totalOut: 0,
          stockBalance: 0,
        });
      }
      for (const branch of branchIds) {
        mapBranchProduct.push({
          date: '2023-01-01',
          branchId: branch.id,
          branchMasterId: branch.branchMasterId,
          productId: product.id,
          productName: product.name,
          amount: 0,
          allTimeAmount: 0,
        });

        limitProduct.push({
          branchId: branch.id,
          branchMasterId: 1,
          productId: product.id,
          productName: product.name,
          productTypeId: product.productTypeId,
          limit: null,
        });

        branchStock.push({
          amount: 0,
          branchId: branch.id,
          branchMasterId: branch.branchMasterId,
          productId: product.id,
          productName: product.name,
          productTypeId: product.productTypeId,
        });
      }

      await tx.stock.createMany({ data: stock });
      await tx.mapBranchProduct.createMany({ data: mapBranchProduct });
      await tx.limitProduct.createMany({ data: limitProduct });
      await tx.branchStock.createMany({ data: branchStock });
      return product;
    });

    return response;
  }

  async listProducts(branchMasterId: number, branchId: number) {
    const products = await this.prisma.product.findMany();

    const limitProduct = await this.prisma.limitProduct.findMany({
      select: { productId: true, limit: true },
      where: { branchId },
    });

    const stockLefts = await this.prisma.stock.findMany({
      select: { stockBalance: true, productId: true },
      where: { branchMasterId },
      distinct: ['productId'],
      orderBy: { date: 'desc' },
    });

    return products.map((p) => {
      const limit = limitProduct.find((lm) => lm.productId === p.id).limit;
      const stockLeft = stockLefts.find(
        (stl) => stl.productId === p.id,
      ).stockBalance;
      return {
        ...p,
        price: p.price.toFixed(2),
        limit: !limit || limit > stockLeft ? stockLeft : limit,
        stockLeft,
      };
    });
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: number, input: UpdateProductReq): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new HttpException('Product Does Not Exist', HttpStatus.BAD_REQUEST);
    }

    const response = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: input,
      });

      await tx.mapBranchProduct.updateMany({
        where: { productId: id },
        data: { productName: input.name },
      });
      return product;
    });
    return response;
  }

  async remove(id: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.mapBranchProduct.deleteMany({ where: { productId: id } });
      await tx.product.deleteMany({ where: { id } });
    });
    return `removes product #${id} success`;
  }

  async listProductLimit(
    branchMasterId: number,
    user: UserTokenPayload,
    branchId?: number,
  ) {
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.branchMasterId !== branchMasterId
    ) {
      throw new HttpException(
        'Branch Master Id Does Not Match',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const productType = await this.prisma.productType.findMany({
      orderBy: { id: 'asc' },
    });
    const res = productType.map((pt) => {
      return {
        productType: pt.name,
        products: [],
      };
    });

    const limitProduct = await this.prisma.limitProduct.findMany({
      where: { branchMasterId, branchId: branchId ?? null },
      orderBy: { productId: 'asc' },
    });
    limitProduct.map((p) => {
      res[p.productTypeId - 1].products.push({
        id: p.productId,
        name: p.productName,
        limit: p.limit,
      });
    });

    return res;
  }

  async setLimitProduct(input: SetProductLimitReq, user: UserTokenPayload) {
    if (
      user.role === UserRole.ADMIN &&
      input.branchMasterId != user.branchMasterId
    ) {
      throw new HttpException('Unauthorized', HttpStatus.BAD_REQUEST);
    }

    const itemString = input.items.map((i) => `${i.productId}|${i.limit}`);

    await this.prisma.$executeRaw`CALL set_limit_product(${itemString.join(
      '##',
    )}, ${input.branchMasterId}::INT4, ${input.branchId}::INT4)`;

    return this.listProductLimit(input.branchMasterId, user, input.branchId);
  }

  async listProductType() {
    return this.prisma.productType.findMany();
  }
}
