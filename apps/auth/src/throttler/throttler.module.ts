import { Module } from '@nestjs/common';
import { ThrottlerModule as NestThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    NestThrottlerModule.forRoot(
      process.env.NODE_ENV === 'test'
        ? []
        : [
            // 1. Burst protection (Prevents double-clicks/spamming)
            {
              name: 'short',
              ttl: 1000,
              limit: 2,
            },
            // 2. OTP/Brute-force protection (The main guard)
            {
              name: 'medium',
              ttl: 60000,
              limit: 5,
            },
            // 3. Global anti-spam (Optional but safe)
            {
              name: 'long',
              ttl: 3600000,
              limit: 50,
            },
          ],
    ),
  ],
  exports: [NestThrottlerModule],
})
export class ThrottlerModule {}
