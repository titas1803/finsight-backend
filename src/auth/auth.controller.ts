import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';
import { Currentuser } from './decorators/current-user.decorator';
import { PasswordDto } from './dto/password.dto';
import { type UserDetailType } from './types/auth-types';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { AuthUrls } from './utils/auth.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(AuthUrls.REGISTER)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() registerDto: RegisterDto) {
    return await this.authService.createUser(registerDto);
  }

  @Post(AuthUrls.LOGIN)
  async loginUser(@Body() loginDto: LoginDto) {
    return await this.authService.loginUser(loginDto);
  }

  @Post(AuthUrls.REFRESHTOKEN)
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshTokens(refreshTokenDto.refreshToken);
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
