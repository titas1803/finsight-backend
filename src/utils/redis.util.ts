import { AuthUrls } from '@/auth/utils/auth.enum';
import {
  TransactionType,
  Category,
} from '@/transactions/utils/transaction.enum';
import { TransactionFiltersType } from '@/types/transaction.type';

export const getInsightRedisKey = (userId: string, ...args: string[]) => {
  const baseKey = `insight:${userId}`;

  const finalKey = args.reduce((keyVal, arg) => {
    return keyVal + `:${arg}`;
  }, baseKey);

  return {
    baseKey,
    finalKey,
  };
};

export const redisKeyForRefresh = (userId: string) => {
  return `${AuthUrls.REFRESHTOKEN}:${userId}`;
};

export const loginAttemptsRedisKey = (userId: string) => {
  return `login:attempts:${userId}`;
};

export const loginLockoutRedisKey = (userId: string) => {
  return `login:lockout:${userId}`;
};

export const transactionRedisKeyInital = (userId: string) => {
  return `${userId}:transactions`;
};

export const findTransactionByIdRedisKey = (
  transactiodId: string,
  userId: string,
) => {
  return `${transactionRedisKeyInital(userId)}:byid:${transactiodId}`;
};

export const findAllTransactionsRedisKey = (
  userId: string,
  filters?: TransactionFiltersType,
) => {
  return `${transactionRedisKeyInital(userId)}:all${filters ? `:${JSON.stringify(filters)}` : ''}`;
};

export const findTransactionsSummaryRedisKey = (
  userId: string,
  startDate?: string,
  endDate?: string,
) => {
  return `${transactionRedisKeyInital(userId)}:summary${startDate ? `:start:${startDate}` : ''}${endDate ? `:end:${endDate}` : ''}`;
};

export const findTransactionByTypeAndCategoryRedisKey = (
  userId: string,
  type: TransactionType,
  category?: Category,
) => {
  return `${transactionRedisKeyInital(userId)}:type:${type}${category ? `:category:${category}` : ''}`;
};

export const findTrasactionBySpecificPeriodRedisKey = (
  userId: string,
  startDate: string,
  endDate: string,
) => {
  return `${transactionRedisKeyInital(userId)}:period:startDate:${startDate}:startEnd:${endDate}`;
};
