import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';
import { Currentuser } from '@/auth/decorators/current-user.decorator';
import { type UserDetailType } from '@/types/auth-types';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body() updateUserDto: UpdateUserDto,
    @Currentuser() user: UserDetailType,
  ) {
    return await this.usersService.updateProfile(user, updateUserDto);
  }
}
