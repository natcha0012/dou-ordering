import { Module } from '@nestjs/common';
import { BranchsService } from './branchs.service';
import { BranchsController } from './branchs.controller';

@Module({
  controllers: [BranchsController],
  providers: [BranchsService],
})
export class BranchsModule {}
