import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        // AT_SECRET: Joi.string().required(),
        // RT_SECRET: Joi.string().required(),
        // AT_EXPIRATION: Joi.string().required(),
        // RT_EXPIRATION: Joi.string().required(),
      }),
      envFilePath: './apps/auth/.env',
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
