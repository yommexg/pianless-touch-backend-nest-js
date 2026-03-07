import { NestFactory } from '@nestjs/core';
import { AuditsModule } from './audits.module';

async function bootstrap() {
  const app = await NestFactory.create(AuditsModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
