import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThreatIntelService } from './threat-intel.service';
import {
  QueryThreatIntelDto,
  UrlThreatDto,
  DomainThreatDto,
  CveThreatDto,
  ExposureThreatDto,
} from './dto';
import type { ApiResponse, ThreatIntelResult, ThreatProviderDescriptor } from '@sentinel/types';

@ApiTags('threat-intel')
@ApiBearerAuth()
@Controller('threat-intel')
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ThreatIntelController {
  constructor(private readonly threatIntelService: ThreatIntelService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query external threat intelligence by indicator and type' })
  @SwaggerResponse({ status: 200, description: 'Normalized threat intelligence result' })
  async queryIndicator(@Body() dto: QueryThreatIntelDto): Promise<ApiResponse<ThreatIntelResult>> {
    const data = await this.threatIntelService.queryIndicator(
      dto.type,
      dto.indicator,
      dto.forceRefresh,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze URL using approved external threat intelligence feeds' })
  @SwaggerResponse({ status: 200, description: 'Normalized URL threat intelligence result' })
  async queryUrl(@Body() dto: UrlThreatDto): Promise<ApiResponse<ThreatIntelResult>> {
    const data = await this.threatIntelService.queryUrl(dto.url, dto.forceRefresh);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('domain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze domain or host for known malware and phishing associations' })
  @SwaggerResponse({ status: 200, description: 'Normalized domain threat intelligence result' })
  async queryDomain(@Body() dto: DomainThreatDto): Promise<ApiResponse<ThreatIntelResult>> {
    const data = await this.threatIntelService.queryDomain(dto.domain, dto.forceRefresh);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Query vulnerability intelligence from CISA KEV and advisory databases',
  })
  @SwaggerResponse({ status: 200, description: 'Normalized CVE threat intelligence result' })
  async queryCve(@Body() dto: CveThreatDto): Promise<ApiResponse<ThreatIntelResult>> {
    const data = await this.threatIntelService.queryCve(dto.cveId, dto.forceRefresh);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('exposure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Defensively check indicator for known wild exploitation or infrastructure exposure',
  })
  @SwaggerResponse({ status: 200, description: 'Normalized exposure threat intelligence result' })
  async queryExposure(@Body() dto: ExposureThreatDto): Promise<ApiResponse<ThreatIntelResult>> {
    const data = await this.threatIntelService.queryExposure(
      dto.indicator,
      dto.indicatorType || 'CVE',
      dto.forceRefresh,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('providers')
  @ApiOperation({
    summary: 'List all registered Threat Intelligence providers, capabilities, and reliability',
  })
  @SwaggerResponse({ status: 200, description: 'List of provider descriptors' })
  async getProviders(): Promise<ApiResponse<ThreatProviderDescriptor[]>> {
    const data = this.threatIntelService.getProviders();
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
