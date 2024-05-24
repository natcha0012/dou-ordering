import { Body, Controller, Post } from '@nestjs/common';
import { BranchProductsService } from './branch-products.service';
import { Auth } from 'src/decorator/auth.decorator';
import { GetBranchProductReq } from './dto/request.dto';
import { UserData } from 'src/decorator/user.decorator';
import { UserTokenPayload } from 'src/types/token.type';

@Controller('branch-products')
export class BranchProductsController {
  constructor(private readonly branchProductsService: BranchProductsService) {}

  @Post('sold-products-amount')
  @Auth()
  async soldProductAmount(
    @Body() input: GetBranchProductReq,
    @UserData() user: UserTokenPayload,
  ) {
    return this.branchProductsService.soldProductAmount(
      input,
      user.branchMasterId,
    );
  }
}
