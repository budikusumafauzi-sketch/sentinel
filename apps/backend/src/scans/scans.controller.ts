import { Controller, Post, Get, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ScansService } from './scans.service';
import { CreateScanDto, SyncEvidenceDto } from './dto';

@ApiTags('Scans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scan' })
  @ApiResponse({ status: 201, description: 'Scan created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateScanDto,
  ) {
    const scan = await this.scansService.create(user.id, dto);
    return {
      success: true,
      data: scan,
      timestamp: new Date().toISOString(),
    };
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Synchronize device evidence for a scan' })
  @ApiResponse({ status: 200, description: 'Evidence recorded and scan completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  async syncEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SyncEvidenceDto,
  ) {
    const scan = await this.scansService.syncEvidence(id, user.id, dto);
    return {
      success: true,
      data: scan,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all scans for current user' })
  @ApiResponse({ status: 200, description: 'List of scans' })
  async findAll(@CurrentUser() user: { id: string }) {
    const scans = await this.scansService.findAllByUser(user.id);
    return {
      success: true,
      data: scans,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Get full structured scan report' })
  @ApiResponse({ status: 200, description: 'Complete scan report' })
  @ApiResponse({ status: 404, description: 'Scan report not found' })
  async getReport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const report = await this.scansService.getReport(id, user.id);
    return {
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a scan by ID' })
  @ApiResponse({ status: 200, description: 'Scan details with findings' })
  @ApiResponse({ status: 404, description: 'Scan not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const scan = await this.scansService.findOneByUser(id, user.id);
    return {
      success: true,
      data: scan,
      timestamp: new Date().toISOString(),
    };
  }
}

