import { Test, TestingModule } from '@nestjs/testing';
import { BranchMasterController } from './branch-master.controller';
import { BranchMasterService } from './branch-master.service';

describe('BranchMasterController', () => {
  let controller: BranchMasterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BranchMasterController],
      providers: [BranchMasterService],
    }).compile();

    controller = module.get<BranchMasterController>(BranchMasterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
