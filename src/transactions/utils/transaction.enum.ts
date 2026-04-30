export enum TransactionUrls {
  CREATE = 'new',
  GETALL = 'all',
  GETSUMMARY = 'summary',
  FINDBYID = ':id',
  FINDBYTYPEANDCATEGORY = ':type/by-category',
  GETLASTDAYS = 'last-days',
  UPDATE = 'update/:id',
  DELETE = 'delete/:id',
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  INVESTMENT = 'investment',
}

export enum IncomeCategory {
  SALARY = 'salary',
  DIVIDEND = 'dividend',
  INVESTMENT = 'investment',
}

export enum InvestmentCategory {
  STOCKS = 'stocks',
  MUTUAL_FUND = 'MUTUAL_FUND',
  PPF = 'ppf',
  FD = 'fd',
  INSURANCE = 'insurance',
}

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  SHOPPING = 'shopping',
  BILLS = 'bills',
  TRAVEL = 'travel',
}

export enum Category {
  FOOD = 'food',
  TRANSPORT = 'transport',
  TRAVEL = 'travel',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  SHOPPING = 'shopping',
  BILLS = 'bills',
  SALARY = 'salary',
  DIVIDEND = 'dividend',
  STOCKS = 'stocks',
  MUTUAL_FUND = 'mutual-fund',
  PPF = 'ppf',
  FD = 'fd',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export enum PaymentModes {
  UPI = 'upi',
  CREDIT_CARD = 'credit-card',
  DEBIT_CARD = 'debit-card',
  CASH = 'cash',
  ONLINE_BANKING = 'online-banking',
}
