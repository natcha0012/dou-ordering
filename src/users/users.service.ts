import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import {
  CreateUserReq,
  ResetPasswordReq,
  UpdateOwnUserReq,
  UpdateUsersRoleReq,
} from './dto/request.dto';
import { generateSalt, sha256Encrypt } from 'src/utils';
import { UserRes } from './dto/response.dto';
import { UserRole } from 'src/enum/user.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(username: string): Promise<UserRes> {
    const user = await this.prisma.user.findFirst({ where: { username } });
    return {
      username: user.username,
      role: user.role as UserRole,
      branchId: user.branchId,
      branchMasterId: user.branchMasterId,
      telNo: user.telNo,
    };
  }

  async createUser(input: CreateUserReq): Promise<UserRes> {
    // format error response for frontend
    const DupUser = await this.prisma.user.findUnique({
      where: { username: input.username },
    });

    if (DupUser) {
      throw new HttpException('USER_ALREADY_EXIST', HttpStatus.BAD_REQUEST);
    }

    if (input.role === UserRole.STAFF) {
      if (!input.branchId || !input.branchMasterId)
        throw new HttpException(
          'STAFF Must Have Branch And Branch Master',
          HttpStatus.BAD_REQUEST,
        );
    }

    if (input.role !== UserRole.DELIVER && !input.branchMasterId) {
      throw new HttpException(
        'Branch Master Is Required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = generateSalt();

    const user = await this.prisma.user.create({
      data: {
        ...input,
        password: sha256Encrypt(input.password, salt, 10),
        salt,
      },
    });

    if (!user) {
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      username: user.username,
      role: user.role as UserRole,
      branchId: user.branchId,
      branchMasterId: user.branchMasterId,
      telNo: user.telNo,
    };
  }

  async updateUserRoles(input: UpdateUsersRoleReq) {
    if (input.userIds.includes(1)) {
      throw new HttpException(
        'Cannot Update RootAdmin Role',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.updateMany({
      where: { id: { in: input.userIds } },
      data: { role: input.role },
    });
    return 'update success';
  }

  async resetPassword(id: number, input: ResetPasswordReq) {
    const user = await this.prisma.user.findUnique({
      select: { salt: true },
      where: { id },
    });

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.BAD_REQUEST);
    }
    const salt = user.salt;
    await this.prisma.user.update({
      where: { id },
      data: { password: sha256Encrypt(input.newPassword, salt, 10) },
    });
    return 'reset password success';
  }

  async updateOwnUser(id: number, input: UpdateOwnUserReq) {
    if (!id) {
      throw new HttpException('Invalid Token', HttpStatus.BAD_REQUEST);
    }
    if (input.newPassword && !input.oldPassword) {
      throw new HttpException(
        'Old Password Is Required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const password = input.newPassword;
    const user = await this.prisma.user.findUnique({
      select: { salt: true },
      where: { id },
    });

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.BAD_REQUEST);
    }
    const salt = user.salt;
    await this.prisma.user.update({
      where: { id },
      data: {
        password: password ? sha256Encrypt(password, salt, 10) : undefined,
        telNo: input.telNo,
      },
    });
    return { msg: 'update own user success' };
  }
}
