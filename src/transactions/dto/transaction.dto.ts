import {
  IsCurrency,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  PaymentModes,
  Category,
  TransactionType,
} from '../utils/transaction.enum';

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
  @IsOptional()
  amount?: number;

  @IsEnum(PaymentModes, { message: 'Specify a correct payment mode' })
  @IsOptional()
  paymentMode?: PaymentModes;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(Category, { message: 'Specify a correct category' })
  @IsString({ message: 'category must be a string' })
  @IsOptional()
  category?: Category;

  @IsEnum(TransactionType, {
    message: 'Specify if a transaction in income or expense',
  })
  @IsString({ message: 'category must be a string' })
  @IsOptional()
  type?: TransactionType;

  @IsString({ message: 'description must be a string' })
  @IsOptional()
  description?: string;
}
