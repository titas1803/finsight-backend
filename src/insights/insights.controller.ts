import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '@/users/guards/jwt-auth.guard';
import { Currentuser } from '@/auth/decorators/current-user.decorator';
import { type UserDetailType } from '@/types/auth-types';
import { type PeriodType } from '@/types/common-types';
import { Category } from '@/transactions/utils/transaction.enum';

@Controller('insights')
@UseGuards(JwtAuthGuard)
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  async getInsights(
    @Currentuser() user: UserDetailType,
    @Query('period') period: PeriodType = 'week',
  ) {
    return this.insightsService.getInsights(user.id, period);
  }

  @Get('category')
  async getCategoryInsights(
    @Currentuser() user: UserDetailType,
    @Query('category') category: Category,
  ) {
    return this.insightsService.getCategoryInsights(user.id, category);
  }
}
