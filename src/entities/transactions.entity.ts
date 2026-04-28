import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum Category {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  SHOPPING = 'shopping',
  BILLS = 'bills',
  SALARY = 'salary',
  DIVIDEND = 'dividend',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

export enum PaymentModes {
  UPI = 'upi',
  CREDIT_CARD = 'credit-card',
  DEBIT_CARD = 'debit-card',
  CASH = 'cash',
  ONLINE_BANKING = 'online-banking',
}

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
