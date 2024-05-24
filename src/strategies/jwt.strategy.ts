import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma';
import { UserTokenPayload } from 'src/types/token.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('authSecret'),
      passReqToCallback: true,
    });
  }

  async validate(_: Request, userPayload: UserTokenPayload) {
    const { id, tokenVersion } = userPayload;
    if (!id) {
      throw new HttpException(
        'UNAUTHORIZED - Token Error',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new HttpException(
        'UNAUTHORIZED - User Not Found',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (tokenVersion !== Number(user.tokenVersion)) {
      throw new HttpException(
        'UNAUTHORIZED - Token Expired',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return userPayload;
  }
}
