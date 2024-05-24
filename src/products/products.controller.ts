import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductReq,
  ListProductLimitReq,
  SetProductLimitReq,
  UpdateProductReq,
} from './dto/request.dto';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';
import { UserData } from 'src/decorator/user.decorator';
import { UserTokenPayload } from 'src/types/token.type';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() createProductDto: CreateProductReq) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @Auth(UserRole.STAFF)
  listProducts(@UserData() user: UserTokenPayload) {
    return this.productsService.listProducts(
      user.branchMasterId,
      user.branchId,
    );
  }
  @Get('/types')
  @Auth()
  listProductTypes() {
    return this.productsService.listProductType();
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductReq) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }

  @Post('list-limit')
  @Auth()
  listProdductLimit(
    @Body() input: ListProductLimitReq,
    @UserData() user: UserTokenPayload,
  ) {
    return this.productsService.listProductLimit(
      input.branchMasterId,
      user,
      input.branchId,
    );
  }

  @Post('set-limit')
  @Auth(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  setProdductLimit(
    @Body() input: SetProductLimitReq,
    @UserData() user: UserTokenPayload,
  ) {
    return this.productsService.setLimitProduct(input, user);
  }
}
