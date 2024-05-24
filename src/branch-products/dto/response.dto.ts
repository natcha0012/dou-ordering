import { Decimal } from '@prisma/client/runtime/library';

export type SoldProductResp = {
  sold: Decimal;
  productId: number;
  productName: string;
  percent: string;
};
