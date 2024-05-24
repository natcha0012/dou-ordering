import { Injectable } from '@nestjs/common';
import { BranchMaster, PrismaService } from 'src/prisma';

@Injectable()
export class BranchMasterService {
  constructor(private readonly prisma: PrismaService) {}
  async list(): Promise<BranchMaster[]> {
    return this.prisma.branchMaster.findMany();
  }

  async getBranchMasterDetail(branchMasterId: number) {
    return this.prisma.branchMaster.findUnique({
      where: { id: branchMasterId },
      include: { Branch: true },
    });
  }
}
