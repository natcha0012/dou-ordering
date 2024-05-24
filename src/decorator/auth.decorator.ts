import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { UserRole } from 'src/enum/user.enum';
import { UserAuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(UserAuthGuard, RolesGuard),
  );
}
