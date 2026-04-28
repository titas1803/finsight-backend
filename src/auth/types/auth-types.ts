import { UserEntity, UserRole } from '../../entities/user.entity';

export type JwtPayloadType = {
  email: string;
  userId: string;
  role: UserRole;
};

export type UserDetailType = Omit<UserEntity, 'credential' | 'transactions'>;
