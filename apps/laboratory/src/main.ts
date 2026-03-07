import { NestFactory } from '@nestjs/core';
import { LaboratoryModule } from './laboratory.module';

async function bootstrap() {
  const app = await NestFactory.create(LaboratoryModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
