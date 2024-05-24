import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BullModule } from '@nestjs/bull';
import { STOCK_QUEUE } from 'src/constants/queue';
import { StockModule } from 'src/stock/stock.module';

@Module({
  imports: [BullModule.registerQueue({ name: STOCK_QUEUE }), StockModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
