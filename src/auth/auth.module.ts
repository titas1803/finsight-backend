import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { CredentialsEntity } from '../entities/credentials.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CredentialsEntity])],
  providers: [],
  controllers: [],
})
export class AuthModule {}
