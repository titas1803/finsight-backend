import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async createUser(@Body() registerDto: RegisterDto) {
    return await this.authService.createUser(registerDto);
  }

  @Post('login')
  async loginUser(@Body() loginDto: LoginDto) {
    return await this.authService.loginUser(loginDto);
  }
}
