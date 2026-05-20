import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';
import { Currentuser } from './decorators/current-user.decorator';
import { PasswordDto } from './dto/password.dto';
import { type UserDetailType } from '../types/auth-types';
import { AuthUrls } from './utils/auth.enum';
import { type Response, type Request, CookieOptions } from 'express';
import { ReqIpThrottleGuard } from '@/guard/request-throttle.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  accessTokenConfig: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV?.includes('prod') ?? false,
    sameSite: process.env.NODE_ENV?.includes('prod') ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
    path: '/',
  };

  refreshTokenConfig: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV?.includes('prod') ?? false,
    sameSite: process.env.NODE_ENV?.includes('prod') ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
    path: '/',
  };

  constructor(private readonly authService: AuthService) {}

  @Post(AuthUrls.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ReqIpThrottleGuard)
  @Throttle({ default: { ttl: 60000, limit: 5, blockDuration: 1000 * 60 * 5 } })
  async createUser(@Body() registerDto: RegisterDto) {
    return await this.authService.createUser(registerDto);
  }

  @Post(AuthUrls.LOGIN)
  async loginUser(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, message, refreshToken, user } =
      await this.authService.loginUser(loginDto);

    response.cookie('accessToken', accessToken, this.accessTokenConfig);

    response.cookie('refreshToken', refreshToken, this.refreshTokenConfig);

    return {
      message,
      user,
    };
  }

  @Post(AuthUrls.LOGOUT)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logOut(
    @Res({ passthrough: true }) response: Response,
    @Currentuser() userInfo: UserDetailType,
  ) {
    response.clearCookie('accessToken', { path: '/' });
    response.clearCookie('refreshToken', {
      path: '/',
    });

    return await this.authService.logOut(userInfo.id);
  }

  @Post(AuthUrls.REFRESHTOKEN)
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (
      (request.cookies as { refreshToken: string } | undefined)?.refreshToken
    ) {
      const refreshToken = (request.cookies as { refreshToken: string })
        .refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedException();
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      response.cookie(
        'accessToken',
        tokens.accessToken,
        this.accessTokenConfig,
      );

      response.cookie(
        'refreshToken',
        tokens.refreshToken,
        this.refreshTokenConfig,
      );

      return { message: 'Tokens refreshed successfully' };
    } else {
      throw new UnauthorizedException();
    }
  }

  @Get(AuthUrls.ME)
  @UseGuards(JwtAuthGuard)
  async requestMe(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Currentuser() reqUser: UserDetailType,
  ) {
    const refreshToken = (
      request.cookies as { refreshToken: string } | undefined
    )?.refreshToken;
    if (refreshToken) {
      const user = await this.authService
        .getCurrentUser(refreshToken, reqUser)
        .catch(() => {
          response.clearCookie('accessToken', { path: '/' });
          response.clearCookie('refreshToken', {
            path: '/',
          });
        });
      return { user };
    } else {
      throw new UnauthorizedException('You are not authorized');
    }
  }

  @Patch(AuthUrls.UPDATEPASSWORD)
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Currentuser() userInfo: UserDetailType,
    @Body() passwordDto: PasswordDto,
  ) {
    return await this.authService.updatePassword(
      userInfo.id,
      passwordDto.oldPassword,
      passwordDto.newPassword,
    );
  }
}
