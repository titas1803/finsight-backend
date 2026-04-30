import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUtilService } from './utils/auth-util.service';
import { LoginDto } from './dto/login.dto';
import { CredentialsEntity } from '@/entities/credentials.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(CredentialsEntity)
    private readonly credentialRepo: Repository<CredentialsEntity>,

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

    const hashPassword = await this.authUtils.encryptPassword(password);

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

    const result = await this.authUtils.verifyLogIn(password, user);

    const encryptedRefreshToken = await this.authUtils.encryptRefreshToken(
      result.refreshToken,
    );

    await this.credentialRepo.update(
      { user: { id: user.id } },
      { refreshToken: encryptedRefreshToken },
    );

    return result;
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    const userExists = await this.userRepo.findOne({
      where: { id },
      relations: ['credential'],
    });

    if (!userExists) throw new BadRequestException('Invalid user');

    const isMatch = await this.authUtils.comparePassword(
      oldPassword,
      userExists.credential.password,
    );

    if (!isMatch) throw new UnauthorizedException("Old password didn't match");

    const hashedPassword = await this.authUtils.encryptPassword(newPassword);

    userExists.credential.password = hashedPassword;
    await this.userRepo.save(userExists);

    return { message: 'Password updated successfully' };
  }

  async refreshTokens(incomingRefreshToken: string) {
    const payload = this.authUtils.verifyRefreshToken(incomingRefreshToken);

    const user = await this.userRepo.findOne({
      where: { id: payload.userId },
      relations: ['credential'],
      select: {
        id: true,
        role: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
        credential: {
          refreshToken: true,
        },
      },
    });

    if (!user || !user.credential.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const isValidToken = await this.authUtils.comparePassword(
      incomingRefreshToken,
      user.credential.refreshToken,
    );

    if (!isValidToken) throw new UnauthorizedException('Invalid refresh token');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credential: _, ...filteredUser } = user;

    const token = this.authUtils.generateJwtTokens(filteredUser);

    const encryptedRefreshToken = await this.authUtils.encryptRefreshToken(
      token.refreshToken,
    );

    await this.credentialRepo.update(
      { user: { id: user.id } },
      { refreshToken: encryptedRefreshToken },
    );

    return {
      message: 'Tokens refreshed successfully',
      ...token,
    };
  }

  async logOut(userId: string) {
    await this.credentialRepo.update(
      { user: { id: userId } },
      { refreshToken: null },
    );

    return { message: 'Logged out successfully' };
  }
}
