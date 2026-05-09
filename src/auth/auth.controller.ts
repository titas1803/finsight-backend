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
import { type Response, type Request } from 'express';
import { ReqIpThrottleGuard } from '@/guard/request-throttle.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
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

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
      path: '/',
    });

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: AuthUrls.REFRESHTOKEN,
    });

    return {
      message,
      user,
    };
  }

  @Post(AuthUrls.LOGOUT)
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logOut(@Currentuser() userInfo: UserDetailType) {
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

      const tokens = await this.authService.refreshTokens(refreshToken);

      response.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
        path: '/',
      });

      response.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: AuthUrls.REFRESHTOKEN,
      });

      return tokens;
    } else {
      throw new UnauthorizedException();
    }
  }

  @Get(AuthUrls.ME)
  @UseGuards(JwtAuthGuard)
  requestMe(@Currentuser() user: UserDetailType) {
    return { user };
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
