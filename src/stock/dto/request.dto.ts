import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ListStockReportReq {
  @IsNumberString()
  @IsOptional()
  masterId?: number;
}

export class AddStockReq {
  @IsNumber()
  masterId: number;

  @IsNumber()
  productId: number;

  @IsNumber()
  add: number;
}

export class ListStockByDateReq {
  @IsNumber()
  branchMasterId: number;

  @IsString()
  date: string;
}

export class StockAmount {
  @IsNumber()
  productId: number;

  @IsNumber()
  amount: number;
}

export class updateBranchStockReq {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAmount)
  stock: StockAmount[];
}
