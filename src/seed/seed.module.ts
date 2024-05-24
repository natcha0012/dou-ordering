import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [SeedService],
  imports: [PrismaModule],
})
export class SeedModule {}
