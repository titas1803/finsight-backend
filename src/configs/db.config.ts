import { CredentialsEntity } from '@/entities/credentials.entity';
import { TransactionEntity } from '@/entities/transactions.entity';
import { UserEntity } from '@/entities/user.entity';
import { ConfigService } from '@nestjs/config';

export default function dbFactory(config: ConfigService) {
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
