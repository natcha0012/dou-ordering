import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetBranchProductReq {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  branchId?: number;
}
