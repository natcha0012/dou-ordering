import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';
import {
  AddToCartReq,
  ProductProblem,
  RemoveFromCartReq,
} from './dto/request.dto';
import { UserData } from 'src/decorator/user.decorator';
import { UserTokenPayload } from 'src/types/token.type';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('add-to-cart')
  @Auth(UserRole.STAFF)
  addToCart(@Body() input: AddToCartReq, @UserData() user: UserTokenPayload) {
    return this.orderService.addToCart(user, input);
  }

  @Post('remove-from-cart')
  @Auth(UserRole.STAFF)
  removeFromCart(
    @Body() input: RemoveFromCartReq,
    @UserData() user: UserTokenPayload,
  ) {
    return this.orderService.removeFromCart(input, user);
  }

  @Post('place-order/:id')
  @Auth(UserRole.STAFF)
  placeOrder(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.placeOrder(+id, user);
  }

  @Post('adjust-order/:id')
  @Auth(UserRole.STAFF)
  adjustOrder(
    @Param('id') id: string,
    @UserData() user: UserTokenPayload,
    @Body() input: AddToCartReq,
  ) {
    return this.orderService.adjustOrder(+id, user, input);
  }

  @Post('packing/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PACKING)
  packOrder(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.packOrder(+id, user.id);
  }

  @Post('packed/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PACKING)
  confirmPacked(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.confirmPacked(+id, user);
  }

  @Post('delivering/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DELIVER)
  delivering(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.delivering(+id, user.id);
  }

  @Post('delivered/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DELIVER)
  delivered(@Param('id') id: string) {
    return this.orderService.delivered(+id);
  }

  @Post('problems/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF, UserRole.DELIVER)
  setProblems(
    @Param('id') id: string,
    @Body() input: ProductProblem,
    @UserData() user: UserTokenPayload,
  ) {
    return this.orderService.setProblem(+id, input, user);
  }

  @Post('approve-problems/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  approveProblems(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.approveProblem(+id, user);
  }

  @Post('confirm-order/:id')
  @Auth(UserRole.STAFF, UserRole.SUPER_ADMIN)
  confirmOrder(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.confirmOrder(+id, user);
  }

  @Post('pay-bill/:id')
  @Auth(UserRole.STAFF, UserRole.SUPER_ADMIN)
  payBill(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.payBill(+id, user);
  }

  @Post('approve-payment/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  approvePayment(@Param('id') id: string, @UserData() user: UserTokenPayload) {
    return this.orderService.approvePayment(+id, user);
  }

  @Post('claim/:id')
  @Auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)
  claimProducts(
    @Param('id') id: string,
    @Body() input: ProductProblem,
    @UserData() user: UserTokenPayload,
  ) {
    return this.orderService.claimProducts(+id, input, user);
  }

  @Get('')
  @Auth()
  listOrder(@UserData() user: UserTokenPayload) {
    return this.orderService.listOrder(user);
  }

  @Get(':id')
  @Auth()
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }
}
