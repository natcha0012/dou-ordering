import { Module } from '@nestjs/common';
import { BranchMasterService } from './branch-master.service';
import { BranchMasterController } from './branch-master.controller';

@Module({
  controllers: [BranchMasterController],
  providers: [BranchMasterService],
})
export class BranchMasterModule {}
