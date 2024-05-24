import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BranchsService } from './branchs.service';
import { CreateBranchReq, UpdateBranchReq } from './dto/request.dto';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';

@Controller('branchs')
export class BranchsController {
  constructor(private readonly branchsService: BranchsService) {}

  @Post()
  @Auth(UserRole.SUPER_ADMIN)
  create(@Body() createBranchDto: CreateBranchReq) {
    return this.branchsService.create(createBranchDto);
  }

  @Get()
  @Auth()
  findAll(@Query('branchMasterId') branchMasterId: string) {
    return this.branchsService.list(Number(branchMasterId) || undefined);
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.branchsService.findOne(+id);
  }

  @Patch(':id')
  @Auth(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchReq) {
    return this.branchsService.update(+id, updateBranchDto);
  }

  @Delete(':id')
  @Auth(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.branchsService.remove(+id);
  }
}
