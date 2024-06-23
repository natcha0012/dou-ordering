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
