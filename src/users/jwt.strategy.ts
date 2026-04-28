import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadType, UserDetailType } from '../auth/types/auth-types';
import { UsersService } from '@/users/users.service';
import { UnauthorizedException, Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? '',
    });
  }

  async validate(payload: JwtPayloadType): Promise<UserDetailType> {
    try {
      const user = await this.usersService.findUserById(payload.userId);
      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
