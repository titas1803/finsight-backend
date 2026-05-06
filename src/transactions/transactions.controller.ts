import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionDto, UpdateTransactionDto } from './dto/transaction.dto';
import { Currentuser } from '@/auth/decorators/current-user.decorator';
import { type UserDetailType } from '@/types/auth-types';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';
import {
  TransactionType,
  Category,
  TransactionUrls,
} from './utils/transaction.enum';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Post(TransactionUrls.CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createNewTransaction(
    @Body() transactionDto: TransactionDto,
    @Currentuser() user: UserDetailType,
  ) {
    const { id: userId } = user;
    return await this.transactionService.createTransaction(
      userId,
      transactionDto,
    );
  }

  @Get(TransactionUrls.GETALL)
  async findAllTransactions(
    @Currentuser() user: UserDetailType,
    @Query('type') type?: TransactionType,
    @Query('category') category?: Category,
    @Query('startAmount') startAmount?: string,
    @Query('endAmount') endAmount?: string,
    @Query('startDate') startDate?: string, // format: YYYY-MM-DD
    @Query('endDate') endDate?: string, // format: YYYY-MM-DD
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'date' | 'amount',
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
  ) {
    const { id: userId } = user;
    return await this.transactionService.findAllTransactions(userId, {
      type,
      category,
      startAmount,
      endAmount,
      startDate,
      endDate,
      search,
      sortBy,
      order,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(TransactionUrls.GETSUMMARY)
  async getTransactionSummary(
    @Currentuser() user: UserDetailType,
    @Query('startDate') startDate?: string, // format: YYYY-MM-DD
    @Query('endDate') endDate?: string, // format: YYYY-MM-DD
  ) {
    return await this.transactionService.getTransactionsSummary(
      user.id,
      startDate,
      endDate,
    );
  }

  @Get(TransactionUrls.GETLASTDAYS)
  async getLastPeriod(
    @Currentuser() user: UserDetailType,
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.transactionService.getLastSpecificPeriod(user.id, period);
  }

  @Get(TransactionUrls.FINDBYID)
  async findTransactionById(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Currentuser() user: UserDetailType,
  ) {
    const { id: userId } = user;
    return await this.transactionService.findTransactionById(
      transactionId,
      userId,
    );
  }

  @Get(TransactionUrls.FINDBYTYPEANDCATEGORY)
  async getByTypeAndCategory(
    @Param('type') type: TransactionType,
    @Currentuser() user: UserDetailType,
    @Query('category') category?: Category,
  ) {
    return await this.transactionService.getTransactionByTypeAndCategory(
      user.id,
      type,
      category,
    );
  }

  @Patch(TransactionUrls.UPDATE)
  async updateTransactionById(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Currentuser() user: UserDetailType,
  ) {
    const { id: userId } = user;
    return await this.transactionService.updateTransaction(
      transactionId,
      userId,
      updateTransactionDto,
    );
  }

  @Delete(TransactionUrls.DELETE)
  async deleteTransactionById(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Currentuser() user: UserDetailType,
  ) {
    return await this.transactionService.deleteTransaction(
      transactionId,
      user.id,
    );
  }
}
