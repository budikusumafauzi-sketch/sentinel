import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import type { ApiResponse, HealthStatus } from '@sentinel/types';

const startTime = Date.now();

@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @SwaggerResponse({ status: 200, description: 'Service is healthy' })
  getHealth(): ApiResponse<HealthStatus> {
    return {
      success: true,
      data: {
        status: 'healthy',
        version: '0.1.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
