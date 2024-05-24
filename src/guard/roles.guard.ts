import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserTokenPayload } from 'src/types/token.type';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles.length) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as UserTokenPayload;
    if (!roles.includes(user.role)) {
      throw new HttpException(
        `Permission Denied: Required Roles [${roles.join(',')}]`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }
}
