import { CredentialsEntity } from '@/entities/credentials.entity';
import { TransactionEntity } from '@/entities/transactions.entity';
import { UserEntity } from '@/entities/user.entity';
import { ConfigService } from '@nestjs/config';

export default function dbFactory(config: ConfigService) {
  console.log(!config.get<string>('NODE_ENV')?.includes('prod'));

  if (config.get<string>('NODE_ENV')?.includes('prod')) {
    return {
      type: 'postgres' as const,
      url: config.get<string>('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false, // required for Neon
      },
      entities: [UserEntity, CredentialsEntity, TransactionEntity],
      synchronize: config.get('NODE_ENV') === 'dev',
    };
  }
  return {
    type: 'postgres' as const,
    url: config.get<string>('DATABASE_URL'),
    entities: [UserEntity, CredentialsEntity, TransactionEntity],
    synchronize: config.get('NODE_ENV') === 'dev',
  };
}
