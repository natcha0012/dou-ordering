import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AddToCartReq {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAmount)
  orders: ProductAmount[];
}

export class ProductAmount {
  @IsNumber()
  productId: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  masterRemark?: string;

  @IsOptional()
  @IsString()
  branchRemark?: string;
}

export class RemoveFromCartReq {
  @IsNumber()
  orderId: number;

  @IsNumber()
  productId: number;
}

export class OrderDetail {
  productId: number;
  productName: string;
  amount: number;
  productTypeId: number;
}

export class ActualOrderDetail {
  productId: number;
  amount: number;
  masterRemark?: string;
  branchRemark?: string;
}

export class SpoiledProductDetail {
  productId: number;
  productName: string;
  amount: number;
  pricePerOne: Prisma.Decimal;
  priceLoss: Prisma.Decimal;
}

export class ProductProblem {
  @IsString()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAmount)
  spoiledProducts: ProductAmount[];
}
