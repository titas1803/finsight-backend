import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { JwtPayloadType, UserDetailType } from '../../types/auth-types';
import { UserEntity } from '@/entities/user.entity';
import {
  loginAttemptsRedisKey,
  loginLockoutRedisKey,
} from '@/utils/redis.util';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AuthUtilService {
  private readonly MAX_ATTEPTS = 5;
  private readonly WINDOW_SECONDS = 60;
  private readonly LOCKOUT_SECONDS = 300;

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRedis() private readonly redisClient: Redis,
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

  async checkLoginRateLimit(identifier: string) {
    const lockOutKey = loginLockoutRedisKey(identifier);
    const isLockedOut = await this.redisClient.get(lockOutKey);

    if (isLockedOut) {
      const ttl = await this.redisClient.ttl(lockOutKey);
      throw new HttpException(
        `Too many login attempts. Try again in ${ttl} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const attemptsKey = loginAttemptsRedisKey(identifier);
    const attempts = await this.redisClient.incr(attemptsKey);

    if (attempts === 1)
      await this.redisClient.expire(attemptsKey, this.WINDOW_SECONDS);
    if (attempts > this.MAX_ATTEPTS) {
      await this.redisClient.set(lockOutKey, '1', 'EX', this.LOCKOUT_SECONDS);
      await this.redisClient.del(attemptsKey);

      throw new HttpException(
        `Too many login attempts. You are locked out for ${Number(this.LOCKOUT_SECONDS) / 60} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async clearLoginAttempts(identifier: string) {
    await this.redisClient.del(loginAttemptsRedisKey(identifier));
    await this.redisClient.del(loginLockoutRedisKey(identifier));
  }
}
