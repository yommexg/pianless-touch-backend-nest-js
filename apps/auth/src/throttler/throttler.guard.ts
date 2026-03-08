import { ThrottlerGuard } from '@nestjs/throttler';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ThrottlerEmailGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const body = req.body as { email?: string };

    const tracker = body?.email
      ? `throttle:email:${body.email}`
      : req.ip || 'unknown-ip';

    return Promise.resolve(tracker);
  }

  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          'Too many OTP requests. Please wait a moment before trying again.',
        error: 'Too Many Requests',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
