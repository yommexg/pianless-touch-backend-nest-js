import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import { AuthModule } from './auth.module';
import { LoggerService } from '@app/logger';
import { GlobalExceptionsFilter, PrismaExceptionsFilter } from '@app/filters';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const adapterHost = app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new GlobalExceptionsFilter(logger),
    new PrismaExceptionsFilter(logger, adapterHost),
  );

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);

  logger.log(
    `Painless Touch Care Authentication running on port: ${port}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Critical failure during Authentication bootstrap:', err);
  process.exit(1);
});
