import { Module } from '@nestjs/common';
import { BranchProductsService } from './branch-products.service';
import { BranchProductsController } from './branch-products.controller';

@Module({
  controllers: [BranchProductsController],
  providers: [BranchProductsService],
})
export class BranchProductsModule {}
