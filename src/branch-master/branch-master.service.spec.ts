import { Test, TestingModule } from '@nestjs/testing';
import { BranchMasterService } from './branch-master.service';

describe('BranchMasterService', () => {
  let service: BranchMasterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchMasterService],
    }).compile();

    service = module.get<BranchMasterService>(BranchMasterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
