import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBranchReq, UpdateBranchReq } from './dto/request.dto';
import { Branch, Prisma, PrismaService } from 'src/prisma';

@Injectable()
export class BranchsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(input: CreateBranchReq): Promise<Branch> {
    const DupBranch = await this.prisma.branch.findUnique({
      where: { name: input.name },
    });

    if (DupBranch) {
      throw new HttpException(
        'Branch Is Already Exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const products = await this.prisma.product.findMany({
      select: { id: true, name: true, productTypeId: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({ data: input });
      if (!branch) {
        throw new HttpException(
          'Internal Server Error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const limitProduct: Prisma.LimitProductCreateManyInput[] = [];
      const mapBranchProduct: Prisma.MapBranchProductCreateManyInput[] = [];
      const branchStock: Prisma.BranchStockCreateManyInput[] = [];
      products.forEach((p) => {
        limitProduct.push({
          branchId: branch.id,
          branchMasterId: 1,
          productId: p.id,
          productName: p.name,
          productTypeId: p.productTypeId,
          limit: null,
        });
        mapBranchProduct.push({
          amount: 0,
          allTimeAmount: 0,
          branchId: branch.id,
          branchMasterId: branch.branchMasterId,
          productId: p.id,
          productName: p.name,
          date: '2023-01-01',
        });

        branchStock.push({
          amount: 0,
          branchId: branch.id,
          branchMasterId: branch.branchMasterId,
          productId: p.id,
          productName: p.name,
          productTypeId: p.productTypeId,
        });
      });

      await tx.mapBranchProduct.createMany({
        data: mapBranchProduct,
      });

      await tx.limitProduct.createMany({ data: limitProduct });
      await tx.branchStock.createMany({ data: branchStock });

      return branch;
    });
  }

  async list(branchMasterId?: number): Promise<Branch[]> {
    const branches = await this.prisma.branch.findMany({
      where: { branchMasterId },
    });
    return branches;
  }

  async findOne(id: number): Promise<Branch> {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new HttpException('Branch Does Not Exist', HttpStatus.BAD_REQUEST);
    }
    return branch;
  }

  async update(id: number, input: UpdateBranchReq): Promise<Branch> {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new HttpException('Branch Does Not Exist', HttpStatus.BAD_REQUEST);
    }

    const updatedBrnach = await this.prisma.branch.update({
      where: { id },
      data: input,
    });
    return updatedBrnach;
  }

  async remove(id: number): Promise<string> {
    await this.prisma.branch.delete({ where: { id } });
    return `removes branch #${id} success`;
  }
}
