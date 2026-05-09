import { TransactionEntity } from '@/entities/transactions.entity';
import { TransactionsService } from '@/transactions/transactions.service';
import {
  Category,
  TransactionType,
} from '@/transactions/utils/transaction.enum';
import { getInsightRedisKey } from '@/utils/redis.util';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import OpenAI from 'openai';

@Injectable()
export class InsightsService {
  private openAi: OpenAI;
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.openAi = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  private formatTransactions(transactions: TransactionEntity[]): string {
    const foramttedTransactions = transactions.map(
      (t) =>
        `${t.date} | ${t.type} | ${t.category} | ${t.paymentMode} | ${t.amount} | ${t.description ?? 'N/A'}`,
    );
    return foramttedTransactions.join('\n');
  }

  private reduceTransactions(
    transactions: TransactionEntity[],
    transactionType: TransactionType,
  ): number {
    return transactions
      .filter((t) => t.type === transactionType)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  private calculateStats(transactions: TransactionEntity[]) {
    const totalIncome = this.reduceTransactions(
      transactions,
      TransactionType.INCOME,
    );

    const totalInvestment = this.reduceTransactions(
      transactions,
      TransactionType.INVESTMENT,
    );

    const totalExpense = this.reduceTransactions(
      transactions,
      TransactionType.EXPENSE,
    );

    const byCategory = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        },
        {} as Record<Category, number>,
      );

    const topCategory = Object.entries(byCategory).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      totalInvestment: totalInvestment.toFixed(2),
      netBalance: (totalIncome - totalExpense - totalInvestment).toFixed(2),
      topExpenseCategory: topCategory
        ? `${topCategory[0]} (₹${topCategory[1].toFixed(2)})`
        : 'N/A',
      transactionCount: transactions.length,
    };
  }

  private buildPrompt(
    transactions: TransactionEntity[],
    periodLabel: string,
  ): string {
    const stats = this.calculateStats(transactions);

    return `
You are a friendly and concise personal finance advisor.
Analyze the following transactions from the ${periodLabel} and provide:
1. A brief summary of spending behavior (1-2 sentences)
2. One positive observation
3. One specific actionable tip to improve finances

Key stats:
- Total Income:      ₹${stats.totalIncome}
- Total Expense:     ₹${stats.totalExpense}
- Total Investment:  ₹${stats.totalInvestment}
- Net Balance:       ₹${stats.netBalance}
- Top Expense Category: ${stats.topExpenseCategory}
- Total Transactions: ${stats.transactionCount}

Raw transactions (date | type | category | paymentMode | amount | description):
${this.formatTransactions(transactions)}

Keep response under 120 words. Be specific, not generic.
`.trim();
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const completion = await this.openAi.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a personal finance advisor. Be concise, friendly, and specific. Never give generic advice.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return completion.choices[0].message.content ?? 'No insights available.';
  }

  /**
   * Get insights for a user based on their transactions in the last specific period (week, month, or year). It fetches the relevant transactions for the user and period, formats the data, and calls the OpenAI API to generate insights based on the user's spending behavior. The response includes a summary of spending, a positive observation, and a specific tip for improving finances. If no transactions are found for the specified period, it returns a message encouraging the user to start logging transactions to receive insights.
   * Note: This method is used by the InsightsController to provide personalized insights to the user based on their recent transaction history.
   * The insights are generated using the GPT-4 model from OpenAI, and the prompt is carefully crafted to elicit specific and actionable advice for the user.
   * @param userId the ID of the user for whom to generate insights
   * @param period the period to analyze transactions for, which can be 'week', 'month', or 'year'
   * @returns an object containing the period, generated insight, count of transactions analyzed, and key statistics about the user's finances during that period
   */
  async getInsights(userId: string, period: 'week' | 'month' | 'year') {
    const { finalKey } = getInsightRedisKey(userId, period);
    //  eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const cached = await this.redis.get(finalKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached as string);
    const periodLabel = {
      week: 'Last 7 days',
      month: 'last 30 days',
      year: 'last 1 year',
    }[period];

    const { transactions, count } =
      await this.transactionsService.getLastSpecificPeriod(userId, period);

    if (count === 0) {
      return {
        period,
        insight: `No transactions in the ${periodLabel}. Start logging to get AI insights!`,
        transactionCount: 0,
        stats: null,
      };
    }

    const prompt = this.buildPrompt(transactions, periodLabel);
    const insight = await this.callOpenAI(prompt);

    const finalData = {
      period,
      insight,
      transactionCount: count,
      stats: this.calculateStats(transactions),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.redis.set(finalKey, JSON.stringify(finalData), 'EX', 3600);
    return finalData;
  }

  /**
   * Get insights for a user based on transactions of a specific category in the last 30 days. It fetches the relevant transactions for the user and category, formats the data, and calls the OpenAI API to generate insights focused on that category. The response includes a specific tip for optimizing spending in that category, along with key statistics about the user's transactions in that category during the last 30 days. If no transactions are found for the specified category, it returns a message indicating that no insights can be generated due to lack of data.
   * Note: This method is used by the InsightsController to provide category-specific insights to the user, helping them understand and optimize their spending habits in different areas of their finances.
   * The insights are generated using the GPT-4 model from OpenAI, and the prompt is designed to elicit specific advice related to the user's behavior in that category.
   * @param userId the ID of the user for whom to generate insights
   * @param category the category of transactions to analyze
   * @returns an object containing the category, generated insight, count of transactions analyzed, and key statistics about the user's finances in that category
   */
  async getCategoryInsights(userId: string, category: Category) {
    // ✅ uses your actual findAllTransactions with filters
    const { finalKey } = getInsightRedisKey(userId, category);
    //  eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const cached = await this.redis.get(finalKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) return JSON.parse(cached as string);

    const { transactions, count } =
      await this.transactionsService.findAllTransactions(userId, {
        category,
        startDate: (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d.toISOString().split('T')[0];
        })(),
        endDate: new Date().toISOString().split('T')[0],
      });

    if (count === 0) {
      return {
        category,
        insight: `No transactions found for category "${category}" in the last 30 days.`,
        transactionCount: 0,
        stats: null,
      };
    }

    const prompt = `
You are a personal finance advisor.
Analyze these "${category}" transactions from the last 30 days and give one specific tip to optimize this category.
Keep it under 80 words. Be specific.

Transactions (date | type | paymentMode | amount | description):
${this.formatTransactions(transactions)}
    `.trim();

    const insight = await this.callOpenAI(prompt);

    const finalData = {
      category,
      insight,
      transactionCount: count,
      stats: this.calculateStats(transactions),
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.redis.set(finalKey, JSON.stringify(finalData), 'EX', 3600);

    return finalData;
  }
}
