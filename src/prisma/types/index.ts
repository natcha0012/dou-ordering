import { Prisma, PrismaClient } from '@prisma/client';

const { Decimal } = Prisma;

export { Decimal };

export type TQueryClient =
  | PrismaClient
  | Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, undefined>,
      '$connect' | '$disconnect' | '$on' | '$use' | '$transaction'
    >;
