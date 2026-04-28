import { UserEntity } from '@/entities/user.entity';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/user.dto';
import { UserDetailType } from '@/auth/types/auth-types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async updateProfile(user: UserDetailType, data: UpdateUserDto) {
    const { id } = user;
    const userExists = await this.userRepo.findOneBy({ id });
    if (!userExists) throw new UnauthorizedException('You are not authorized');

    const emailExist = await this.userRepo.count({
      where: { email: data.email },
    });
    if (emailExist > 0)
      throw new ConflictException('Email id already present in the database');

    try {
      const updateDetails = await this.userRepo
        .createQueryBuilder()
        .update(UserEntity)
        .set({
          firstName: data.firstName ?? userExists.firstName,
          lastName: data.lastName ?? userExists.lastName,
          email: data.email ?? userExists.email,
          phoneNumber: data.phoneNumber ?? userExists.phoneNumber,
        })
        .where('id = :id', { id })
        .execute();

      return {
        message: 'Your details are updated successfully',
        affected: updateDetails.affected,
      };
    } catch (err) {
      throw new InternalServerErrorException((err as Error).message);
    }
  }

  async findUserById(id: string) {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) throw new NotFoundException('user not found');
    return user;
  }
}
