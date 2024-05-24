import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';
import {
  CreateUserReq,
  ResetPasswordReq,
  UpdateOwnUserReq,
  UpdateUsersRoleReq,
} from './dto/request.dto';
import { UserData } from 'src/decorator/user.decorator';
import { UserTokenPayload } from 'src/types/token.type';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Auth(UserRole.SUPER_ADMIN)
  async createUser(@Body() input: CreateUserReq) {
    return this.usersService.createUser(input);
  }

  @Patch('role')
  @Auth(UserRole.SUPER_ADMIN)
  async updateUserRoles(@Body() input: UpdateUsersRoleReq) {
    return this.usersService.updateUserRoles(input);
  }

  @Patch('/reset-password/:id')
  @Auth(UserRole.SUPER_ADMIN)
  async resetPassword(
    @Param('id') id: string,
    @Body() input: ResetPasswordReq,
  ) {
    return this.usersService.resetPassword(+id, input);
  }

  @Patch()
  @Auth()
  async updateOwnUser(
    @Body() input: UpdateOwnUserReq,
    @UserData() user: UserTokenPayload,
  ) {
    return this.usersService.updateOwnUser(user.id, input);
  }

  @Get('profile')
  @Auth()
  async findOne(@UserData() user: UserTokenPayload) {
    return this.usersService.findOne(user.username);
  }
}
