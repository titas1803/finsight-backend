import {
  PaymentModes,
  TransactionType,
  Category,
} from '../utils/transaction.enum';

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
