import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Decimal, PrismaService } from 'src/prisma';
import { GetBranchProductReq } from './dto/request.dto';
import { SoldProductResp } from './dto/response.dto';

@Injectable()
export class BranchProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async soldProductAmount(
    input: GetBranchProductReq,
    branchMasterId: number,
  ): Promise<SoldProductResp[]> {
    const date1 = input.startDate || undefined;
    const date2 = input.endDate || undefined;

    const startRecord = await this.prisma.mapBranchProduct.findMany({
      where: {
        branchMasterId,
        branchId: input.branchId || undefined,
        date: date1 ? { lt: date1 } : '2023-01-01',
      },
      distinct: 'productId',
      orderBy: { date: 'desc' },
    });

    const endRecord = await this.prisma.mapBranchProduct.findMany({
      where: {
        branchMasterId,
        branchId: input.branchId || undefined,
        date: date2 ? { lte: date2 } : undefined,
      },
      distinct: 'productId',
      orderBy: { date: 'desc' },
    });

    const products = await this.prisma.product.findMany({
      select: { id: true, name: true },
    });

    let res: SoldProductResp[] = [];
    let totalSold = new Decimal(0);
    products.forEach((p) => {
      const bp1 = startRecord.find((bp) => bp.productId === p.id);
      if (!bp1) {
        throw new HttpException(
          'data missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const bp2 = endRecord.find((bp) => bp.productId === p.id);
      if (!bp2) {
        throw new HttpException(
          'data missing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const sold = new Decimal(Number(bp2.allTimeAmount - bp1.allTimeAmount));
      totalSold = totalSold.plus(sold);
      res.push({
        productId: p.id,
        sold,
        productName: p.name,
        percent: '0',
      });
    });
    res = res.sort((a, b) => b.sold.minus(a.sold).toNumber());
    return res.map((r) => {
      return {
        ...r,
        percent: totalSold.equals(0)
          ? '0'
          : r.sold.dividedBy(totalSold).mul(100).toFixed(0),
      };
    });
  }
}
