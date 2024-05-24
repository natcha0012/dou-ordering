import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma';
import { BranchsModule } from './branchs/branchs.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { BullModule } from '@nestjs/bull';
import { StockConsumer } from './queue/stock.consumer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrderModule } from './order/order.module';
import { BranchProductsModule } from './branch-products/branch-products.module';
import { BranchMasterModule } from './branch-master/branch-master.module';
import config from './config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    AuthModule,
    UsersModule,
    PrismaModule,
    BranchsModule,
    ProductsModule,
    StockModule,
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redisHost'),
          port: configService.get('redisPort'),
        },
        defaultJobOptions: { attempts: 3, removeOnComplete: true },
      }),
      inject: [ConfigService],
    }),
    OrderModule,
    BranchProductsModule,
    BranchMasterModule,
  ],
  controllers: [AppController],
  providers: [AppService, StockConsumer, JwtStrategy],
})
export class AppModule {}
