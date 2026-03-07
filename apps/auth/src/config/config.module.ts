import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.string().required(),

        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().required(),

        MAIL_HOST: Joi.string().required(),
        MAIL_PORT: Joi.string().required(),
        MAIL_USER: Joi.string().required(),
        MAIL_PASS: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),

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
