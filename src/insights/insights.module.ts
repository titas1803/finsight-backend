import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from '@/entities/transactions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  providers: [InsightsService],
  controllers: [InsightsController],
})
export class InsightsModule {}
