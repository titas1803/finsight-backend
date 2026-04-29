import {
  Category,
  PaymentModes,
  TransactionType,
} from '@/entities/transactions.entity';
import {
  IsCurrency,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class TransactionDto {
  @IsCurrency({
    symbol: '₹',
    require_symbol: false,
    digits_after_decimal: [2],
  })
  @IsNotEmpty({ message: 'amount is requried' })
  amount!: number;

  @IsEnum(PaymentModes, { message: 'Specify a correct payment mode' })
  @IsNotEmpty({ message: 'Payment mode is required' })
  paymentMode!: PaymentModes;

  @IsDateString()
  @IsNotEmpty({ message: 'date is requried' })
  date!: string;

  @IsEnum(Category, { message: 'Specify a correct category' })
  @IsString({ message: 'category must be a string' })
  @IsNotEmpty({ message: 'category is requried' })
  category!: Category;

  @IsEnum(TransactionType, {
    message: 'Specify if a transaction in income or expense',
  })
  @IsString({ message: 'category must be a string' })
  @IsNotEmpty({ message: 'category is requried' })
  type!: TransactionType;

  @IsString({ message: 'description must be a string' })
  @IsOptional()
  description?: string;
}

export class UpdateTransactionDto {
  @IsCurrency({
    symbol: '₹',
    require_symbol: false,
    digits_after_decimal: [2],
  })
  amount?: number;

  @IsEnum(PaymentModes, { message: 'Specify a correct payment mode' })
  paymentMode?: PaymentModes;

  @IsDateString()
  date?: string;

  @IsEnum(Category, { message: 'Specify a correct category' })
  @IsString({ message: 'category must be a string' })
  category?: Category;

  @IsEnum(TransactionType, {
    message: 'Specify if a transaction in income or expense',
  })
  @IsString({ message: 'category must be a string' })
  type?: TransactionType;

  @IsString({ message: 'description must be a string' })
  @IsOptional()
  description?: string;
}
