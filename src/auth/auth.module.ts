import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { CredentialsEntity } from '../entities/credentials.entity';
import { AuthUtilService } from './utils/auth-util.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@/users/users.module';
import { JwtStrategy } from '../users/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CredentialsEntity]),
    PassportModule,
    JwtModule.register({}),
    UsersModule,
  ],
  providers: [AuthService, AuthUtilService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
