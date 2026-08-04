import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
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
}
