import { Module } from '@nestjs/common';
import { ExpoNotificationsService } from './expo-notifications.service';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [LoggerModule],
  providers: [ExpoNotificationsService],
  exports: [ExpoNotificationsService],
})
export class ExpoNotificationsModule {}
