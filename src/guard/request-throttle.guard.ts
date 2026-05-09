import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

@Injectable()
export class ReqIpThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const forwardedFor = req.headers['x-forwarded-for'];

    const ip = forwardedFor
      ? (forwardedFor as string).split(',')[0].trim()
      : req.ip;

    return Promise.resolve(`req-${ip}`);
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      `Too many frequent requests, Please try agail after 1 minute`,
    );
  }
}
