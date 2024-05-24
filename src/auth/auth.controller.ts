import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLogin } from './dto/request.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() userLogin: UserLogin) {
    return this.authService.signIn(userLogin);
  }
}
