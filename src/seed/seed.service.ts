import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/index';
import { users, branchMaster, branch, product, productType } from './data';
@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}
  async seed() {
    await this.prisma.branchMaster.createMany(branchMaster);
    await this.prisma.branch.createMany(branch);
    await this.prisma.user.createMany(users);
    await this.prisma.productType.createMany(productType);
    await this.prisma.product.createMany(product);
  }
}
