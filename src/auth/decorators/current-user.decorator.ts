import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDetailType } from '../types/auth-types';

export const Currentuser = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const req: { user: UserDetailType } = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
