import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { LoggerService } from '@app/logger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  const port = configService.getOrThrow<number>('PORT');
  await app.listen(port);

  logger.log(
    `Painless Touch Care Notifications running on port: ${port}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Critical failure during Notifications bootstrap:', err);
  process.exit(1);
});
