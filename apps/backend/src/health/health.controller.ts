import { Controller, Get, Inject, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import type { ApiResponse, HealthStatus } from '@sentinel/types';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

const startTime = Date.now();

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @SwaggerResponse({ status: 200, description: 'Service health status' })
  async getHealth(): Promise<ApiResponse<HealthStatus & { database: string; redis: string }>> {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'unhealthy';
    }

    try {
      await this.redis.ping();
    } catch {
      redisStatus = 'unavailable';
    }

    const overallStatus =
      dbStatus === 'unhealthy'
        ? 'unhealthy'
        : redisStatus === 'unavailable'
          ? 'degraded'
          : 'healthy';

    return {
      success: true,
      data: {
        status: overallStatus,
        version: '0.1.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: dbStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
