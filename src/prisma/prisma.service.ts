import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

//todo hooks are not working
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    // >>> Middleware #1 createdAt
    this.$use(async (_params, next) => {
      const params = { ..._params };
      const models: Prisma.ModelName[] = ['Order'];
      if (!models.includes(params.model)) return next(params);
      const updateActions: Prisma.PrismaAction[] = ['create', 'createMany'];
      if (!updateActions.includes(params.action)) return next(params);
      if (params.args.data !== undefined) {
        params.args.data.createdAt = BigInt(Date.now());
        params.args.data.updatedAt = BigInt(Date.now());
      } else {
        params.args.data = {
          createdAt: BigInt(Date.now()),
          updatedAt: BigInt(Date.now()),
        };
      }
      const result = await next(params);
      return result;
    });

    // >>> Middleware #2 updatedAt
    this.$use(async (_params, next) => {
      const params = { ..._params };
      const models: Prisma.ModelName[] = ['Order'];
      if (!models.includes(params.model)) return next(params);
      const updateActions: Prisma.PrismaAction[] = ['update', 'updateMany'];
      if (!updateActions.includes(params.action)) return next(params);
      if (params.args.data !== undefined) {
        params.args.data.updatedAt = BigInt(Date.now());
      } else {
        params.args.data = {
          updatedAt: BigInt(Date.now()),
        };
      }
      return next(params);
    });
  }

  async onModuleInit() {
    this.logger.log('connecting prisma db');
    await this.$connect();
  }
}
