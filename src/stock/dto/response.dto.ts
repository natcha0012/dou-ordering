import { Stock } from '@prisma/client';

export type ListStockBranchMasterRes = Omit<
  Stock,
  'branchMasterId' | 'readyToPack' | 'id'
> & { id: string };
