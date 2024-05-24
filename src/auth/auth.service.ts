import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserLogin } from './dto/request.dto';
import { sha256Encrypt } from 'src/utils';
import { UserTokenPayload } from 'src/types/token.type';
import { UserRole } from 'src/enum/user.enum';
import { PrismaService } from 'src/prisma';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  sign(payload: UserTokenPayload, expiresIn?: string | number) {
    if (expiresIn) {
      return this.jwtService.sign(payload, { expiresIn });
    } else {
      return this.jwtService.sign(payload);
    }
  }

  verify(token: string) {
    try {
      return this.jwtService.verify<{ username: string }>(token);
    } catch (error) {
      return;
    }
  }

  async signIn({ username, password }: UserLogin) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new HttpException(
        'UNAUTHORIZED - User Not Found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const hashPassword = sha256Encrypt(password, user.salt, 10);
    if (user.password !== hashPassword) {
      throw new HttpException(
        'UNAUTHORIZED - Incorrect Password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenVersion = Date.now();
    await this.prisma.user.update({
      where: { username },
      data: { tokenVersion },
    });

    const token = this.sign({
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
      tokenVersion,
      branchId: user.branchId,
      branchMasterId: user.branchMasterId,
    });

    return {
      token,
      userId: user.id,
      username: user.username,
      role: user.role as UserRole,
      branchId: user.branchId,
      branchMasterId: user.branchMasterId,
    };
  }
}
