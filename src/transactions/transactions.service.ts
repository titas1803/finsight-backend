import { TransactionEntity } from '@/entities/transactions.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { UserEntity } from '@/entities/user.entity';
import { Repository } from 'typeorm';
import { TransactionFiltersType } from '../types/transaction.type';
import { TransactionType, Category } from './utils/transaction.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}
  /**
   * Find a transaction by its ID and the user ID to ensure the transaction belongs to the user.
   * @param transactionId the ID of the transaction to be retrieved
   * @param userId the ID of the user to ensure the transaction belongs to the user
   * @returns the transaction entity if found, otherwise throws a NotFoundException
   * Note: This is a private method used internally by other service methods to validate the existence of a transaction and its association with the user before performing operations like update or delete.
   */
  private async findById(transactionId: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, user: { id: userId } },
    });

    if (!transaction) throw new NotFoundException('No transaction found');

    return transaction;
  }

  /**
   * Create a new transaction for a user. It first checks if the user exists, then creates and saves the transaction associated with that user.
   * @param userId
   * @param transaction
   * @returns
   */
  async createTransaction(userId: string, transaction: TransactionDto) {
    const newTransaction = this.transactionRepo.create({
      ...transaction,
      user: { id: userId },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, ...savedTransaction } =
      await this.transactionRepo.save(newTransaction);

    return {
      message: `New transaction of ${savedTransaction.amount} is added`,
      transaction: savedTransaction,
    };
  }

  /**
   * Find a transaction by its ID for a specific user. It uses the private findById method to ensure the transaction belongs to the user and returns the transaction details if found.
   * If the transaction is not found, it throws a NotFoundException.
   * @param transactionId the ID of the transaction to be retrieved
   * @param userId the ID of the user to ensure the transaction belongs to the user
   * @returns an object containing a message and the transaction details if found
   */
  async findTransactionById(transactionId: string, userId: string) {
    const transaction = await this.findById(transactionId, userId);

    return {
      message: 'Transaction found',
      transaction,
    };
  }

  /**
   * Find all transactions for a user with optional filters. It builds a dynamic query based on the provided filters such as category, type, payment mode, amount range, date range, and search keyword. The results can be sorted by date or amount in ascending or descending order. It returns the list of transactions that match the filters along with the total count.
   * If no transactions are found, it throws a NotFoundException.
   * Note: This method is used by the insights service to fetch transactions based on user-selected criteria for generating insights.
   * @param userId the ID of the user to fetch transactions for
   * @param filters optional filters to apply to the transaction query, including category, type, payment mode, amount range, date range, search keyword, and sorting options
   * @returns an object containing a message, the count of transactions found, and the list of transactions that match the filters
   */
  async findAllTransactions(userId: string, filters?: TransactionFiltersType) {
    const dbAlias = 'transaction';
    const query = this.transactionRepo
      .createQueryBuilder(dbAlias)
      .where(`${dbAlias}.user.id = :userId`, { userId });

    // filter by category
    if (filters?.category) {
      query.andWhere(`${dbAlias}.category = :category`, {
        category: filters.category,
      });
    }

    // filter by type
    if (filters?.type) {
      query.andWhere(`${dbAlias}.type = :type`, { type: filters.type });
    }

    // filter by payment mode
    if (filters?.paymentMode) {
      query.andWhere(`${dbAlias}.paymentMode = :paymentMode`, {
        paymentMode: filters.paymentMode,
      });
    }

    // Filter amount range
    if (filters?.startAmount && filters?.endAmount) {
      query.andWhere(`${dbAlias}.amount BETWEEN :startAmount AND :endAmount`, {
        startAmount: filters.startAmount,
        endAmount: filters.endAmount,
      });
    } else if (filters?.startAmount) {
      query.andWhere(`${dbAlias}.amount >= :startAmount`, {
        startAmount: filters.startAmount,
      });
    } else if (filters?.endAmount) {
      query.andWhere(`${dbAlias}.amount <= :endAmount`, {
        endAmount: filters.endAmount,
      });
    }

    // filter date range
    if (filters?.startDate && filters?.endDate) {
      query.andWhere(`${dbAlias}.date BETWEEN :startDate AND :endDate`, {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters?.startDate) {
      query.andWhere(`${dbAlias}.date >= :startDate`, {
        startDate: filters.startDate,
      });
    } else if (filters?.endDate) {
      query.andWhere(`${dbAlias}.date <= :endDate`, {
        endDate: filters.endDate,
      });
    }

    // filter by search keyword
    if (filters?.search) {
      query.andWhere(`LOWER(${dbAlias}.description) LIKE LOWER(:search)`, {
        search: `%${filters.search}%`,
      });
    }

    const sortBy = filters?.sortBy ?? 'date';
    const sortOrder = filters?.order ?? 'DESC';
    query.orderBy(`${dbAlias}.${sortBy}`, sortOrder);

    const [transactions, count] = await query.getManyAndCount();

    if (count === 0) {
      throw new NotFoundException('No transaction found matching the criteria');
    }

    return {
      message: `${count} transactions found`,
      count,
      transactions,
    };
  }

  /**
   * Update a transaction by its ID for a specific user. It first checks if the transaction exists and belongs to the user using the private findById method. Then it updates the transaction with the provided fields in the UpdateTransactionDto. If the transaction is successfully updated, it returns a message indicating how many records were updated. If the transaction is not found or does not belong to the user, it throws a NotFoundException.
   * Note: This method allows partial updates, meaning you can update one or more fields of the transaction without providing all the fields.
   * @param transactionId the ID of the transaction to be updated
   * @param userId the ID of the user to ensure the transaction belongs to the user
   * @param updateTransactionDto an object containing the fields to be updated (amount, category, date, type, paymentMode, description)
   * @returns an object containing a message about the update and the count of updated records
   */
  async updateTransaction(
    transactionId: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const existingTransaction = await this.findById(transactionId, userId);

    const updateResult = await this.transactionRepo.update(
      { id: transactionId, user: { id: userId } },
      {
        amount: updateTransactionDto.amount ?? existingTransaction.amount,
        category: updateTransactionDto.category ?? existingTransaction.category,
        date: updateTransactionDto.date ?? existingTransaction.date,
        type: updateTransactionDto.type ?? existingTransaction.type,
        paymentMode:
          updateTransactionDto.paymentMode ?? existingTransaction.paymentMode,
        description:
          updateTransactionDto.description ?? existingTransaction.description,
      },
    );

    return {
      message: `${updateResult.affected} transaction data updated`,
      count: updateResult.affected,
    };
  }

  /**
   * Delete a transaction by its ID for a specific user. It first checks if the transaction exists and belongs to the user using the private findById method. Then it deletes the transaction from the database. If the transaction is successfully deleted, it returns a message indicating how many records were deleted. If the transaction is not found or does not belong to the user, it throws a NotFoundException.
   * @param transactionid the ID of the transaction to be deleted
   * @param userId the ID of the user to ensure the transaction belongs to the user
   * @returns an object containing a message about the deletion and the count of deleted records
   */
  async deleteTransaction(transactionid: string, userId: string) {
    const deletedTransaction = await this.transactionRepo.delete([
      { id: transactionid, user: { id: userId } },
    ]);

    if (!deletedTransaction.affected)
      throw new NotFoundException(
        "Either transaction not found or you don't have enough permission",
      );

    return {
      message: `${deletedTransaction.affected} transaction records deleted`,
      count: deletedTransaction.affected,
    };
  }

  /**
   * Get a summary of transactions for a user within an optional date range. It calculates the total income, total expense, total investment, net balance, and the count of transactions. The method builds a dynamic query to aggregate the transaction data based on the provided user ID and date filters. If no transactions are found for the specified criteria, it throws a NotFoundException.
   * This method is useful for generating insights and summaries for the user based on their transaction history.
   * @param userId the user ID
   * @param startDate the start date for filtering transactions (optional) in YYYY-MM-DD format
   * @param endDate the end date for filtering transactions (optional) in YYYY-MM-DD format
   * @returns an object containing totalIncome, totalExpense, totalInvestment, netbalance, and transactionCount
   */
  async getTransactionsSummary(
    userId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dbAlias = 'transaction';
    const query = this.transactionRepo
      .createQueryBuilder(dbAlias)
      .select(
        `SUM(CASE WHEN ${dbAlias}.type = :income THEN ${dbAlias}.amount ELSE 0 END)`,
        'totalIncome',
      )
      .addSelect(
        `SUM(CASE WHEN ${dbAlias}.type = :expense THEN ${dbAlias}.amount ELSE 0 END)`,
        'totalExpense',
      )
      .addSelect(
        `SUM(CASE WHEN ${dbAlias}.type = :investment THEN ${dbAlias}.amount ELSE 0 END)`,
        'totalInvestment',
      )
      .addSelect(`COUNT(${dbAlias}.id)`, 'transactionCount')
      .setParameters({
        income: TransactionType.INCOME,
        expense: TransactionType.EXPENSE,
        investment: TransactionType.INVESTMENT,
      })
      .where(`${dbAlias}.user.id = :userId`, { userId });

    if (startDate && endDate) {
      query.andWhere(`${dbAlias}.date BETWEEN :startDate AND :endDate`, {
        startDate,
        endDate,
      });
    } else if (startDate) {
      query.andWhere(`${dbAlias}.date >= :startDate`, {
        startDate,
      });
    } else if (endDate) {
      query.andWhere(`${dbAlias}.date <= :endDate`, {
        endDate,
      });
    }

    const result:
      | {
          totalIncome: string;
          totalExpense: string;
          totalInvestment: string;
          transactionCount: string;
        }
      | undefined = await query.getRawOne();

    if (!result) throw new NotFoundException('No transaction found');

    const totalIncome = parseFloat(result.totalIncome) || 0;
    const totalInvestment = parseFloat(result.totalInvestment) || 0;
    const totalExpense = parseFloat(result.totalExpense) || 0;
    const netbalance = totalIncome - totalInvestment - totalExpense;
    const transactionCount = parseInt(result.transactionCount) || 0;

    return {
      totalIncome,
      totalInvestment,
      totalExpense,
      netbalance,
      transactionCount,
    };
  }

  /**
   * Get transactions summary by type and category for a user. It aggregates the total amount and count of transactions based on the specified transaction type (income, expense, or investment) and optional category. The method builds a dynamic query to group the transactions by category and calculate the total amount for each category. It also calculates the percentage contribution of each category to the total amount for the specified transaction type. If no transactions are found for the given criteria, it throws a NotFoundException.
   * This method is useful for generating insights into which categories contribute the most to a user's income, expenses, or investments.
   * @param userId the user ID
   * @param type the transaction type
   * @param category the category (optional)
   * @returns
   */
  async getTransactionByTypeAndCategory(
    userId: string,
    type: TransactionType,
    category?: Category,
  ) {
    const dbAlias = 'transaction';
    const query = this.transactionRepo
      .createQueryBuilder(dbAlias)
      .select(`${dbAlias}.category`, 'category')
      .addSelect(`SUM(${dbAlias}.amount)`, 'total')
      .addSelect(`COUNT(${dbAlias}.id)`, 'count')
      .where(`${dbAlias}.user = :userId`, { userId })
      .andWhere(`${dbAlias}.type = :type`, { type })
      .groupBy(`${dbAlias}.category`)
      .orderBy('total', 'DESC');

    const totalQuery = this.transactionRepo
      .createQueryBuilder(dbAlias)
      .select(`SUM(${dbAlias}.amount)`, 'total')
      .where(`${dbAlias}.user = :userId`, { userId })
      .andWhere(`${dbAlias}.type = :type`, { type });

    if (category) {
      query.andWhere(`${dbAlias}.category = :category`, { category });
    }

    const total: { total: string } | undefined = await totalQuery.getRawOne();

    const rows: { category: string; total: string; count: string }[] =
      await query.getRawMany();

    if (rows.length === 0)
      throw new NotFoundException(
        category
          ? `No ${type}s found for category: ${category}`
          : `No ${type}s transactions found`,
      );

    if (!total || parseFloat(total.total) === 0)
      throw new NotFoundException(`No transaction found for type: ${type}`);

    return rows.map((row) => ({
      category: row.category,
      total: parseFloat(row.total),
      percentage: (
        (parseFloat(row.total) / parseFloat(total.total)) *
        100
      ).toFixed(2),
      count: parseInt(row.count),
    }));
  }

  /**
   * Get transactions for a user from the last specific number of days (week, month, or year). It calculates the date range based on the current date and the specified number of days, then queries the database for transactions that fall within that date range for the given user. If no transactions are found for the specified criteria, it throws a NotFoundException.
   * This method is used by the insights service to fetch recent transactions for generating insights based on recent activity.
   * @param userId the user ID
   * @param numberOfDays the period to query: 'week', 'month', or 'year'
   * @returns an object containing message, count, and transactions
   */
  async getLastSpecificDays(
    userId: string,
    numberOfDays: 'week' | 'month' | 'year' = 'week',
  ) {
    const today = new Date();

    const daysAgo = new Date();

    // Format to YYYY-MM-DD to match your date column type
    const toDateString = (date: Date) => date.toISOString().split('T')[0];

    switch (numberOfDays) {
      case 'week':
        daysAgo.setDate(today.getDate() - 7);
        break;

      case 'month':
        daysAgo.setMonth(today.getMonth() - 1);
        break;

      case 'year':
        daysAgo.setFullYear(today.getFullYear() - 1);
        break;
      default:
        throw new BadRequestException(
          'You can check insight of transactions of just last 1 week or 1 month or 1 year from today',
        );
    }

    const dbAlias = 'transaction';
    const [transactions, count] = await this.transactionRepo
      .createQueryBuilder(dbAlias)
      .where(`${dbAlias}.user = :userId`, { userId })
      .andWhere(`${dbAlias}.date BETWEEN :startDate and :endDate`, {
        startDate: toDateString(daysAgo),
        endDate: toDateString(today),
      })
      .orderBy(`${dbAlias}.date`, 'DESC')
      .getManyAndCount();

    return {
      message:
        count === 0
          ? `No data found for last 1 ${numberOfDays}`
          : `${count} results found`,
      count,
      transactions,
    };
  }
}
