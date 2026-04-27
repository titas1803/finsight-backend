import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CredentialsEntity } from './credentials.entity';
import { TransactionEntity } from './transactions.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 50 })
  firstName!: string;

  @Column({ length: 50 })
  lastName?: string;

  @Column({ length: 100, unique: true })
  email!: string;

  @Column({ length: 10, unique: true, default: null })
  phoneNumber?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => CredentialsEntity, (credential) => credential.user, {
    cascade: true,
  })
  credential!: CredentialsEntity;

  @OneToMany(() => TransactionEntity, (transaction) => transaction.user)
  transactions?: TransactionEntity[];
}
