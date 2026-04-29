import {
  TransactionEntity,
  TransactionType,
} from '@/entities/transactions.entity';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { UserEntity } from '@/entities/user.entity';
import { Repository } from 'typeorm';
import { TransactionFiltersType } from './types/transaction.type';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepo: Repository<TransactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async createTransaction(userId: string, transaction: TransactionDto) {
    const user = await this.userRepo.findOneBy({ id: userId });

    if (!user) throw new UnauthorizedException('Unauthorized user');

    const newTransaction = this.transactionRepo.create({
      ...transaction,
      user,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _, ...savedTransaction } =
      await this.transactionRepo.save(newTransaction);

    return {
      message: `New transaction of ${savedTransaction.amount} is added`,
      transaction: savedTransaction,
    };
  }

  private async findById(transactionId: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, user: { id: userId } },
    });

    if (!transaction) throw new NotFoundException('No transaction found');

    return transaction;
  }

  async findTransactionById(transactionId: string, userId: string) {
    const transaction = await this.findById(transactionId, userId);

    if (!transaction) throw new NotFoundException('No transaction found');

    return {
      message: 'Transaction found',
      transaction,
    };
  }

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
    return {
      message: `${count} transactions found`,
      count,
      transactions,
    };
  }

  async updateTransaction(
    transactionId: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    const existingTransaction = await this.findById(transactionId, userId);

    const updateResult = await this.transactionRepo.update(
      [{ id: transactionId }, { user: { id: userId } }],
      {
        amount: updateTransactionDto.amount ?? existingTransaction.amount,
        category: updateTransactionDto.category ?? existingTransaction.category,
        date: updateTransactionDto.date ?? existingTransaction.date,
        type: updateTransactionDto.type ?? existingTransaction.type,
        paymentMode:
          updateTransactionDto.paymentMode ?? existingTransaction.paymentMode,
        description:
          updateTransactionDto.description ?? updateTransactionDto.description,
      },
    );

    return {
      message: `${updateResult.affected} transaction data updated`,
      count: updateResult.affected,
    };
  }

  async deleteTransaction(transactionid: string, userId: string) {
    const deletedTransaction = await this.transactionRepo.delete([
      { id: transactionid },
      { user: { id: userId } },
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
}
