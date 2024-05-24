import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () {
    return +this.toString();
  };

  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);
  await seedService.seed();
  await app.close();
}
void bootstrap();
