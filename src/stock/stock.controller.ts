import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import {
  AddStockReq,
  ListStockByDateReq,
  ListStockReportReq,
} from './dto/request.dto';
import { Auth } from 'src/decorator/auth.decorator';
import { UserRole } from 'src/enum/user.enum';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCER,
    UserRole.PACKING,
  )
  listStockReport(@Query() { masterId }: ListStockReportReq) {
    return this.stockService.listStockReport(Number(masterId));
  }

  @Get('branch/:branchId')
  @Auth(UserRole.STAFF)
  listBranchStock(@Param('branchId') branchId: string) {
    return this.stockService.listBranchStock(Number(branchId));
  }

  @Post('list-by-date')
  @Auth(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.PRODUCER,
    UserRole.PACKING,
  )
  listStockByDate(@Body() input: ListStockByDateReq) {
    return this.stockService.listStockByDate(input.branchMasterId, input.date);
  }

  @Post()
  @Auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PRODUCER)
  addStock(@Body() input: AddStockReq) {
    return this.stockService.addStock(input);
  }
}
