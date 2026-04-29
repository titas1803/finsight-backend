import {
  Body,
  Controller,
  Delete,
  Get,
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
import { type UserDetailType } from '@/auth/types/auth-types';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';
import { Category, TransactionType } from '@/entities/transactions.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionService: TransactionsService) {}

  @Post('new')
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

  @Get('all')
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
    });
  }

  @Get('summary')
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

  @Get(':id')
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

  @Patch('update/:id')
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

  @Delete('delete/:id')
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
