import { TransactionEntity } from '@/entities/transactions.entity';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionDto } from './dto/transaction.dto';
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

    const savedTransaction = await this.transactionRepo.save(newTransaction);

    return {
      message: `New transaction of ${savedTransaction.amount} is added`,
      transaction: savedTransaction,
    };
  }

  async findTransactionById(transactionId: string, userId: string) {
    const transaction = await this.transactionRepo.findOne({
      where: { id: transactionId, user: { id: userId } },
    });

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
      message: `${count} transactions added`,
      count,
      transactions,
    };
  }
}
