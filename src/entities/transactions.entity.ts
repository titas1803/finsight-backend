import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import {
  PaymentModes,
  Category,
  TransactionType,
} from '@/transactions/utils/transaction.enum';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description?: string;

  @Column({ type: 'enum', enum: PaymentModes })
  paymentMode!: PaymentModes;

  @Column({ type: 'enum', enum: Category })
  category!: Category;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ type: 'date' })
  date!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (u) => u.transactions, { onDelete: 'CASCADE' })
  user!: UserEntity;
}
