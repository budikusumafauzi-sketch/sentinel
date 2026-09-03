import { Controller, Post, Get, Param, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto';

@ApiTags('Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a recommendation' })
  @ApiResponse({ status: 201, description: 'Recommendation created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRecommendationDto,
  ) {
    const recommendation = await this.recommendationsService.create(user.id, dto);
    return {
      success: true,
      data: recommendation,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List recommendations by finding' })
  @ApiQuery({ name: 'findingId', required: true })
  @ApiResponse({ status: 200, description: 'List of recommendations' })
  async findByFinding(
    @Query('findingId', ParseUUIDPipe) findingId: string,
    @CurrentUser() user: { id: string },
  ) {
    const recommendations = await this.recommendationsService.findByFinding(findingId, user.id);
    return {
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: 'List recommendations by device' })
  @ApiResponse({ status: 200, description: 'List of recommendations for device' })
  async findByDevice(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @CurrentUser() user: { id: string },
  ) {
    const recommendations = await this.recommendationsService.findByDevice(deviceId, user.id);
    return {
      success: true,
      data: recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a recommendation by ID' })
  @ApiResponse({ status: 200, description: 'Recommendation details' })
  @ApiResponse({ status: 404, description: 'Recommendation not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const recommendation = await this.recommendationsService.findOne(id, user.id);
    return {
      success: true,
      data: recommendation,
      timestamp: new Date().toISOString(),
    };
  }
}
