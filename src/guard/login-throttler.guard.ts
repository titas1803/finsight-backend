import { LoginDto } from '@/auth/dto/login.dto';
import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, LoginDto>): Promise<string> {
    const email = req.body.email;
    return Promise.resolve(`login-${email}`);
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      ` Too many attempts, Please try agail after 1 minute`,
    );
  }
}
