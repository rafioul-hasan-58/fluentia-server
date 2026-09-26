import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          // MongoDB compatible ping check
          await this.prisma.user.findFirst();
          return { database: { status: 'up' } };
        } catch (error: any) {
          const errMsg = error instanceof Error ? error.message : String(error);
          return { database: { status: 'down', message: errMsg } };
        }
      },
    ]);
  }

  @Get('see-balance/deepseek')
  @ApiOperation({
    summary: 'Check DeepSeek balance',
    description:
      'Returns the balance and active status of the DeepSeek API key',
  })
  async getDeepSeekBalance() {
    const setting = await this.prisma.platformSetting.findFirst();
    const apiKey =
      setting?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';

    if (!apiKey) {
      return {
        isActive: false,
        balance: 0,
        currency: 'USD',
        message: 'DeepSeek API key is not configured',
      };
    }

    try {
      const response = await fetch('https://api.deepseek.com/user/balance', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          isActive: false,
          balance: 0,
          currency: 'USD',
          statusCode: response.status,
          error: errorText,
        };
      }

      const data = (await response.json()) as {
        is_available?: boolean;
        balance_infos?: Array<{
          currency?: string;
          total_balance?: string;
          granted_balance?: string;
          topped_up_balance?: string;
        }>;
      };

      const primaryBalance = data.balance_infos?.[0];
      const parsedBalance = primaryBalance?.total_balance
        ? parseFloat(primaryBalance.total_balance)
        : 0;

      return {
        isActive: data.is_available ?? false,
        balance: parsedBalance,
        currency: primaryBalance?.currency || 'USD',
        grantedBalance: primaryBalance?.granted_balance
          ? parseFloat(primaryBalance.granted_balance)
          : 0,
        toppedUpBalance: primaryBalance?.topped_up_balance
          ? parseFloat(primaryBalance.topped_up_balance)
          : 0,
      };
    } catch (error: any) {
      return {
        isActive: false,
        balance: 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
