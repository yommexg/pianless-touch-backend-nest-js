import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
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
}
