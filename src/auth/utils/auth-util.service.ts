import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { JwtPayloadType, UserDetailType } from '../../types/auth-types';
import { UserEntity } from '@/entities/user.entity';

@Injectable()
export class AuthUtilService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  private async hashDatas(data: string): Promise<string> {
    return bcrypt.hash(
      data,
      parseInt(this.config.get<string>('PASSWORD_SALT') ?? '10', 10),
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
      expiresIn: '15m',
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
      refreshToken: this.generateRefreshToken(user),
    };
  }

  async encryptRefreshToken(refreshToken: string) {
    return await this.hashDatas(refreshToken);
  }

  async encryptPassword(password: string) {
    return await this.hashDatas(password);
  }

  async verifyLogIn(enteredPassword: string, user: UserEntity) {
    const isMatch = await this.comparePassword(
      enteredPassword,
      user.credential.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credential: _, ...filterUser } = user;

    const tokens = this.generateJwtTokens(filterUser);

    return { message: 'Login successful!', user: filterUser, ...tokens };
  }

  verifyRefreshToken(refreshToken: string) {
    try {
      return this.jwtService.verify<JwtPayloadType>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
