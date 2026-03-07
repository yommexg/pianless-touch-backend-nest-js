import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import { AuthModule } from './auth.module';
import { LoggerService } from '@app/logger';
import { PrismaExceptionsFilter } from '@app/prisma';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(
    new PrismaExceptionsFilter(logger, { httpAdapter } as HttpAdapterHost),
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
