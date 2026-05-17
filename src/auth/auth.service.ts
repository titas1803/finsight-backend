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
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { redisKeyForRefresh } from '@/utils/redis.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRedis() private readonly redis: Redis,

    private readonly authUtils: AuthUtilService,
  ) {}

  /**
   * Create a new user account based on the provided registration details. It checks for existing email and phone number to prevent duplicates, hashes the password, and saves the new user along with their credentials in the database. If the email or phone number already exists, it throws a ConflictException. Upon successful registration, it returns a welcome message to the user.
   * @param registerDto an object containing the user's registration details, including email, phone number, first name, last name, and password
   * @returns an object containing a message welcoming the user to their new account
   */
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

  /**
   * Log in a user based on the provided login details. It checks if the user exists using either email or phone number, verifies the password, and generates JWT access and refresh tokens. The refresh token is encrypted and stored in the database for future validation. If the login credentials are invalid, it throws an UnauthorizedException. Upon successful login, it returns the generated tokens along with a success message.
   * @param loginDto an object containing the user's login details, which can include either email or phone number along with the password
   * @returns an object containing a message indicating successful login and the generated access and refresh tokens
   */
  async loginUser(loginDto: LoginDto) {
    const { email, phoneNumber, password } = loginDto;

    let user: UserEntity | null = null;

    const identifier = email ?? phoneNumber ?? 'unknown';

    await this.authUtils.checkLoginRateLimit(identifier);

    if (email) {
      user = await this.userRepo.findOne({
        where: { email },
        relations: ['credential'],
      });
      if (!user) {
        throw new UnauthorizedException("Email address doesn't exist");
      }
    } else if (phoneNumber) {
      user = await this.userRepo.findOne({
        where: { phoneNumber },
        relations: ['credential'],
      });
      if (!user) throw new UnauthorizedException("Phone number doesn't exist");
    } else {
      throw new BadRequestException('Provide either email or phone number');
    }

    const result = await this.authUtils.verifyLogIn(password, user);

    const encryptedRefreshToken = await this.authUtils.encryptRefreshToken(
      result.refreshToken,
    );

    await this.redis.set(
      redisKeyForRefresh(user.id),
      encryptedRefreshToken,
      'EX',
      3600 * 24 * 7,
    );

    await this.authUtils.clearLoginAttempts(identifier);

    return result;
  }

  /**
   * Update a user's password based on their ID and the old and new passwords provided. It first verifies the user's existence and checks if the old password matches the one stored in the database. If the old password is correct, it hashes the new password and updates the user's credential information in the database. If the old password is incorrect, it throws an UnauthorizedException.
   * @param id the ID of the user whose password to update
   * @param oldPassword the current password of the user
   * @param newPassword the new password for the user
   * @returns an object containing a message indicating successful password update
   */
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

  /**
   * Refresh JWT access and refresh tokens based on the provided refresh token. It verifies the incoming refresh token, checks if it matches the one stored in the database for the user, and if valid, generates new access and refresh tokens. The new refresh token is encrypted and updated in the database. If the incoming refresh token is invalid or does not match the stored token, it throws an UnauthorizedException or ForbiddenException respectively. Upon successful token refresh, it returns the new tokens along with a success message.
   * Note: This method is crucial for maintaining user sessions without requiring them to log in again, while also ensuring security by validating the refresh token and preventing unauthorized access.
   * @param incomingRefreshToken the refresh token provided by the user
   * @returns an object containing the new access and refresh tokens along with a success message
   */
  async refreshTokens(incomingRefreshToken: string) {
    const payload = this.authUtils.verifyRefreshToken(incomingRefreshToken);

    const user = await this.userRepo.findOneBy({ id: payload.userId });

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    const cacheKey = redisKeyForRefresh(user.id);

    const storedRefreshToken = await this.redis.get(cacheKey);

    if (!storedRefreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const isValidToken = await this.authUtils.comparePassword(
      incomingRefreshToken,
      storedRefreshToken,
    );

    if (!isValidToken) throw new UnauthorizedException('Invalid refresh token');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { credential: _, ...filteredUser } = user;

    const token = this.authUtils.generateJwtTokens(filteredUser);

    const encryptedRefreshToken = await this.authUtils.encryptRefreshToken(
      token.refreshToken,
    );

    await this.redis.set(
      redisKeyForRefresh(user.id),
      encryptedRefreshToken,
      'EX',
      3600 * 24 * 7,
    );

    return {
      message: 'Tokens refreshed successfully',
      ...token,
    };
  }

  /**
   * Log out a user by invalidating their refresh token. It updates the user's credential information in the database to set the refresh token to null, effectively logging the user out and preventing any further use of the previous refresh token for generating new access tokens. Upon successful logout, it returns a message indicating that the user has been logged out successfully.
   * @param userId the ID of the user to be logged out
   * @returns confirmation message indicating successful logout
   */
  async logOut(userId: string) {
    await this.redis.del(`refresh_token:${userId}`);

    return { message: 'Logged out successfully' };
  }
}
