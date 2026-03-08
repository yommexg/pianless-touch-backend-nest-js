import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisOptions } from 'ioredis';

import { ConfigModule } from '../config';

@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisOptions: RedisOptions = {
          host: config.get('REDIS_HOST')!,
          port: config.get('REDIS_PORT')!,
          password: config.get('REDIS_PASSWORD'),
        };

        return {
          throttlers: [
            { name: 'short', ttl: 1000, limit: 3 },
            { name: 'medium', ttl: 60000, limit: 20 },
            { name: 'long', ttl: 3600000, limit: 200 },
          ],
          storage: new ThrottlerStorageRedisService(redisOptions),
        };
      },
    }),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
