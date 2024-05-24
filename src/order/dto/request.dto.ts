import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

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
  pricePerOne: Prisma.Decimal;
  balance: Prisma.Decimal;
  productTypeId: number;
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
