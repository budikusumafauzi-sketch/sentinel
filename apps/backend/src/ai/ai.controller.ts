import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiService } from './ai.service';
import {
  SecurityAdvisorDto,
  ThreatAnalysisDto,
  MessageAnalysisDto,
  UrlAnalysisDto,
  ScreenshotAnalysisDto,
} from './dto';
import { ApiResponse } from '@sentinel/types';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('findings/:id/explain')
  @HttpCode(HttpStatus.OK)
  async explainFinding(
    @CurrentUser() user: { id: string },
    @Param('id') findingId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.explainFinding(user.id, findingId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('advisor')
  @HttpCode(HttpStatus.OK)
  async getSecurityAdvisor(
    @CurrentUser() user: { id: string },
    @Body() dto: SecurityAdvisorDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.getSecurityAdvisor(user.id, dto.deviceId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('threat')
  @HttpCode(HttpStatus.OK)
  async analyzeThreat(
    @CurrentUser() user: { id: string },
    @Body() dto: ThreatAnalysisDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.analyzeThreat(user.id, dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async analyzeMessage(
    @CurrentUser() user: { id: string },
    @Body() dto: MessageAnalysisDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.analyzeMessage(user.id, dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('url')
  @HttpCode(HttpStatus.OK)
  async analyzeUrl(
    @CurrentUser() user: { id: string },
    @Body() dto: UrlAnalysisDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.analyzeUrl(user.id, dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('screenshot')
  @HttpCode(HttpStatus.OK)
  async analyzeScreenshot(
    @CurrentUser() user: { id: string },
    @Body() dto: ScreenshotAnalysisDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.aiService.analyzeScreenshot(user.id, dto);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
