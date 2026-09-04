import { Controller, Post, Get, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto';

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @ApiOperation({ summary: 'Store a security score' })
  @ApiResponse({ status: 201, description: 'Score stored' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@CurrentUser() user: { id: string }, @Body() dto: CreateScoreDto) {
    const score = await this.scoresService.create(user.id, dto);
    return {
      success: true,
      data: score,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get scores for a device' })
  @ApiQuery({ name: 'deviceId', required: true })
  @ApiResponse({ status: 200, description: 'Score history' })
  async findByDevice(
    @Query('deviceId', ParseUUIDPipe) deviceId: string,
    @CurrentUser() user: { id: string },
  ) {
    const scores = await this.scoresService.findByDevice(deviceId, user.id);
    return {
      success: true,
      data: scores,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get the latest score for a device' })
  @ApiQuery({ name: 'deviceId', required: true })
  @ApiResponse({ status: 200, description: 'Latest score' })
  async getLatest(
    @Query('deviceId', ParseUUIDPipe) deviceId: string,
    @CurrentUser() user: { id: string },
  ) {
    const score = await this.scoresService.getLatest(deviceId, user.id);
    return {
      success: true,
      data: score,
      timestamp: new Date().toISOString(),
    };
  }
}
