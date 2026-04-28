import {
  Category,
  PaymentModes,
  TransactionType,
} from '@/entities/transactions.entity';

export type TransactionFiltersType = {
  startAmount?: string;
  endAmount?: string;
  paymentMode?: PaymentModes;
  type?: TransactionType;
  category?: Category;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'date' | 'amount';
  order?: 'ASC' | 'DESC';
};
