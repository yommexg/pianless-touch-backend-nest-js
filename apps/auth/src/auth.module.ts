import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { MailModule } from '@app/mail';
import { PrismaModule } from '@app/prisma';
import { SmsModule } from '@app/sms';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from './config';
import { ThrottlerEmailGuard, ThrottlerModule } from './throttler';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    MailModule,
    ThrottlerModule,
    PrismaModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerEmailGuard,
    },
  ],
})
export class AuthModule {}
