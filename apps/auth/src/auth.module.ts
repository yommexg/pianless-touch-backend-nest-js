import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { ConfigModule } from './config';
import { LoggerModule } from '@app/logger';

@Module({
  imports: [ConfigModule, LoggerModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
