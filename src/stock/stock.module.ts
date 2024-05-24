import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { BullModule } from '@nestjs/bull';
import { STOCK_QUEUE } from 'src/constants/queue';

@Module({
  imports: [BullModule.registerQueue({ name: STOCK_QUEUE })],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
