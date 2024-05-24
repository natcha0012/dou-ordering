import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { telNoRegex } from 'src/constants/regex';
import { UserRole } from 'src/enum/user.enum';

export class CreateUserReq {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: string;

  @IsNumber()
  @IsOptional()
  branchId: number;

  @IsNumber()
  @IsOptional()
  branchMasterId: number;

  @IsString()
  @IsOptional()
  @Matches(telNoRegex, { message: 'telNo is in wrong format' })
  telNo: string;
}

export class UpdateUsersRoleReq {
  @IsEnum(UserRole)
  role: UserRole;

  @IsArray()
  @IsNumber({}, { each: true })
  userIds: number[];
}

export class ResetPasswordReq {
  @IsString()
  newPassword: string;
}

export class UpdateOwnUserReq {
  @IsOptional()
  @IsString()
  oldPassword: string;

  @IsOptional()
  @IsString()
  newPassword: string;

  @IsOptional()
  @IsString()
  @Matches(telNoRegex, { message: 'telNo is in wrong format' })
  telNo: string;
}
