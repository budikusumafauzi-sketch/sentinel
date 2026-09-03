import { Controller, Post, Get, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateDeviceDto,
  ) {
    const device = await this.devicesService.create(user.id, dto);
    return {
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all devices for current user' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  async findAll(@CurrentUser() user: { id: string }) {
    const devices = await this.devicesService.findAllByUser(user.id);
    return {
      success: true,
      data: devices,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get security history for a device' })
  @ApiResponse({ status: 200, description: 'List of security history records' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const history = await this.devicesService.getHistory(id, user.id);
    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get security events for a device' })
  @ApiResponse({ status: 200, description: 'List of security events' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async getEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const events = await this.devicesService.getEvents(id, user.id);
    return {
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiResponse({ status: 200, description: 'Device details' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const device = await this.devicesService.findOneByUser(id, user.id);
    return {
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
    };
  }
}
