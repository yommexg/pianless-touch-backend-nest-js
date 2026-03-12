import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { MailModule } from '@app/mail';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from './config';
import { ThrottlerEmailGuard, ThrottlerModule } from './throttler';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RedisModule,
    MailModule,
    ThrottlerModule,
    PrismaModule,
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
