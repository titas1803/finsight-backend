import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is requireds' })
  refreshToken!: string;
}
