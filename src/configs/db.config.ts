import { CredentialsEntity } from '@/entities/credentials.entity';
import { TransactionEntity } from '@/entities/transactions.entity';
import { UserEntity } from '@/entities/user.entity';
import { ConfigService } from '@nestjs/config';

export default function dbFactory(config: ConfigService) {
  return {
    type: (config.get<string>('DATABASE_TYPE') ?? 'postgres') as
      | 'postgres'
      | 'mysql'
      | 'sqlite'
      | 'mariadb'
      | 'mongodb'
      | 'oracle'
      | 'mssql',
    host: config.get<string>('DATABASE_HOST'),
    port: parseInt(config.get<string>('DATABASE_PORT') ?? '0', 10),
    username: config.get<string>('DATABASE_USERNAME'),
    password: config.get<string>('DATABASE_PASSWORD'),
    database: config.get<string>('DATABASE_DBNAME'),
    entities: [UserEntity, CredentialsEntity, TransactionEntity],
    synchronize: config.get('NODE_ENV') === 'dev',
  };
}
