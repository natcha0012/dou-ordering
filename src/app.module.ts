import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma';
import { BranchsModule } from './branchs/branchs.module';
import { ProductsModule } from './products/products.module';
import { ConfigModule } from '@nestjs/config';
import { OrderModule } from './order/order.module';
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
    OrderModule,
    BranchMasterModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
