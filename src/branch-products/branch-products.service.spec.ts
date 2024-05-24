import { Test, TestingModule } from '@nestjs/testing';
import { BranchProductsService } from './branch-products.service';

describe('BranchProductsService', () => {
  let service: BranchProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BranchProductsService],
    }).compile();

    service = module.get<BranchProductsService>(BranchProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
