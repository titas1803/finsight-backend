import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { JwtPayloadType, UserDetailType } from '../types/auth-types';

@Injectable()
export class AuthUtilService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(
      password,
      this.config.get<string>('PASSWORD_SALT') ?? 10,
    );
  }

  async comparePassword(
    enteredPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(enteredPassword, storedPassword);
  }

  generateAccessToken(user: UserDetailType) {
    const payload: JwtPayloadType = {
      email: user.email,
      userId: user.id,
      role: user.role,
    };

    const secret = this.config.get<string>('JWT_ACCESS_SECRET');

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: '1h',
    });
  }

  generateRefreshToken(user: UserDetailType) {
    const payload: JwtPayloadType = {
      email: user.email,
      userId: user.id,
      role: user.role,
    };

    const secret = this.config.get<string>('JWT_REFRESH_SECRET');

    return this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d',
    });
  }

  generateJwtTokens(user: UserDetailType) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToke: this.generateRefreshToken(user),
    };
  }
}
