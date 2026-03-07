import { NestFactory } from '@nestjs/core';
import { DoctorsModule } from './doctors.module';

async function bootstrap() {
  const app = await NestFactory.create(DoctorsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
