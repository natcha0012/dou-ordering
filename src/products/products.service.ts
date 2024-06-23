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

    return await this.prisma.product.create({ data: input });
  }

  async listProducts(branchMasterId: number, branchId: number) {
    const products = await this.prisma.product.findMany();
    return products;
  }

  async findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id } });
  }

  async update(id: number, input: UpdateProductReq): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new HttpException('Product Does Not Exist', HttpStatus.BAD_REQUEST);
    }

    return this.prisma.product.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: number) {
    await this.prisma.product.delete({ where: { id } });
    return `removes product #${id} success`;
  }

  async listProductType() {
    return this.prisma.productType.findMany();
  }
}
