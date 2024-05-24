import { Controller, Get } from '@nestjs/common';
import { BranchMasterService } from './branch-master.service';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';
import { UserData } from 'src/decorator/user.decorator';
import { UserTokenPayload } from 'src/types/token.type';

@Controller('branch-master')
export class BranchMasterController {
  constructor(private readonly branchMasterService: BranchMasterService) {}

  @Get('')
  @Auth(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  listAll() {
    return this.branchMasterService.list();
  }

  @Get('branch-master-detail')
  @Auth(UserRole.ADMIN, UserRole.DELIVER, UserRole.PACKING, UserRole.PRODUCER)
  getBranchMasterDetail(@UserData() user: UserTokenPayload) {
    return this.branchMasterService.getBranchMasterDetail(user.branchMasterId);
  }
}
