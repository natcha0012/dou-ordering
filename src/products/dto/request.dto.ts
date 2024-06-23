import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateProductReq {
  @IsString()
  name: string;

  @IsNumber()
  productTypeId: number;
}

export class UpdateProductReq {
  @IsString()
  @IsOptional()
  name?: string;
}

export class ListProductLimitReq {
  @IsNumber()
  branchMasterId: number;

  @IsOptional()
  @IsNumber()
  branchId: number;
}

export class SetProductLimitReq {
  @IsNumber()
  branchMasterId: number;

  @IsOptional()
  @IsNumber()
  branchId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LimitItem)
  items: LimitItem[];
}

export class LimitItem {
  @IsNumber()
  productId: number;

  @IsNumber()
  limit: number;
}
