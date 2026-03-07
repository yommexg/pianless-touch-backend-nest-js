import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { ConfigModule } from './config';

import { LoggerModule } from '@app/logger';
import { RedisModule } from '@app/redis';
import { MailModule } from '@app/mail';

@Module({
  imports: [ConfigModule, LoggerModule, RedisModule, MailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
