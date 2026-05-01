import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from '@/entities/transactions.entity';
import { TransactionsModule } from '@/transactions/transactions.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity]), TransactionsModule],
  providers: [InsightsService],
  controllers: [InsightsController],
})
export class InsightsModule {}
