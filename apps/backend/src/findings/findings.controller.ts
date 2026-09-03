import { Controller, Post, Get, Param, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto';

@ApiTags('Findings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new finding' })
  @ApiResponse({ status: 201, description: 'Finding created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFindingDto,
  ) {
    const finding = await this.findingsService.create(user.id, dto);
    return {
      success: true,
      data: finding,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List findings by scan' })
  @ApiQuery({ name: 'scanId', required: true })
  @ApiResponse({ status: 200, description: 'List of findings' })
  async findByScan(
    @Query('scanId', ParseUUIDPipe) scanId: string,
    @CurrentUser() user: { id: string },
  ) {
    const findings = await this.findingsService.findByScan(scanId, user.id);
    return {
      success: true,
      data: findings,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a finding by ID' })
  @ApiResponse({ status: 200, description: 'Finding details' })
  @ApiResponse({ status: 404, description: 'Finding not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const finding = await this.findingsService.findOne(id, user.id);
    return {
      success: true,
      data: finding,
      timestamp: new Date().toISOString(),
    };
  }
}
