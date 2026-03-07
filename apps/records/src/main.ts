import { NestFactory } from '@nestjs/core';
import { RecordsModule } from './records.module';

async function bootstrap() {
  const app = await NestFactory.create(RecordsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
