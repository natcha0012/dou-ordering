import { UserRole } from 'src/enum/user.enum';

export type UserTokenPayload = {
  id: number;
  username: string;
  role: UserRole;
  branchId: number;
  branchMasterId: number;
  tokenVersion: number;
};
