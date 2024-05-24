import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBranchReq {
  @IsString()
  name: string;

  @IsNumber()
  branchMasterId: number;
}

export class UpdateBranchReq {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  branchMasterId: number;
}
