import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { CredentialsEntity } from '../entities/credentials.entity';
import { AuthUtilService } from './utils/auth-util.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CredentialsEntity]),
    JwtModule.register({}),
    UsersModule,
  ],
  providers: [AuthService, AuthUtilService],
  controllers: [AuthController],
})
export class AuthModule {}
