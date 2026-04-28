import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUtilService } from './utils/auth-util.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly authUtils: AuthUtilService,
  ) {}
  async createUser(registerDto: RegisterDto) {
    const { email, firstName, lastName, password, phoneNumber } = registerDto;
    const existingEmailUser = await this.userRepo.findOne({
      where: { email },
    });
    if (existingEmailUser)
      throw new ConflictException('Email address already exists');

    if (phoneNumber) {
      const existingPhnUser = await this.userRepo.findOne({
        where: { phoneNumber },
      });
      if (existingPhnUser)
        throw new ConflictException('Phone number already exists');
    }

    const hashPassword = await this.authUtils.hashPassword(password);

    const createNewUser = this.userRepo.create({
      firstName,
      lastName,
      email,
      phoneNumber,
      credential: { password: hashPassword },
    });

    const { firstName: savedFirstName, lastName: savedlastName } =
      await this.userRepo.save(createNewUser);

    return {
      message: `Hi ${savedFirstName} ${savedlastName}! Your account is successfully created`,
    };
  }

  async loginUser(loginDto: LoginDto) {
    const { email, phoneNumber, password } = loginDto;

    let user: UserEntity | null = null;

    if (email) {
      user = await this.userRepo.findOne({
        where: { email },
        relations: ['credential'],
      });
      if (!user) throw new UnauthorizedException("Email address doesn't exist");
    } else if (phoneNumber) {
      user = await this.userRepo.findOne({
        where: { phoneNumber },
        relations: ['credential'],
      });
      if (!user) throw new UnauthorizedException("Email address doesn't exist");
    } else {
      throw new BadRequestException('Provide either email or phone number');
    }

    return await this.authUtils.verifyLogIn(password, user);
  }
}
