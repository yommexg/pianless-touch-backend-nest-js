import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class ThrottlerEmailGuard extends ThrottlerGuard {
  protected override getTracker(req: Request): Promise<string> {
    const body = req.body as { email?: string };

    const tracker = body?.email
      ? `throttle:email:${body.email}`
      : req.ip || 'unknown-ip';

    return Promise.resolve(tracker);
  }

  protected override throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { timeToBlockExpire, timeToExpire } = throttlerLimitDetail;
    console.log(throttlerLimitDetail);

    const totalSeconds =
      timeToBlockExpire > 0
        ? timeToBlockExpire
        : Math.ceil(timeToExpire / 1000);

    const minutesToWait = Math.ceil(totalSeconds / 60);

    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader('Retry-After', minutesToWait.toString());

    throw new HttpException(
      'Too many requests. Please try again later.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
