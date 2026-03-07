import { NestFactory } from '@nestjs/core';
import { PrescriptionModule } from './prescription.module';

async function bootstrap() {
  const app = await NestFactory.create(PrescriptionModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
