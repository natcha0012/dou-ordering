import { UserRole } from 'src/enum/user.enum';

export class UserRes {
  username: string;
  role: UserRole;
  branchMasterId?: number;
  branchId?: number;
  telNo?: string;
}
