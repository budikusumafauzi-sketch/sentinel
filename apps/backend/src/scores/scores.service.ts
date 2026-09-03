import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { CreateScoreDto } from './dto';

@Injectable()
export class ScoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async create(userId: string, dto: CreateScoreDto) {
    // Verify device ownership
    await this.devicesService.findOneByUser(dto.deviceId, userId);

    return this.prisma.securityScore.create({
      data: {
        userId,
        deviceId: dto.deviceId,
        overallScore: dto.overallScore,
        categoryScores: dto.categoryScores as any,
      },
    });
  }

  async findByDevice(deviceId: string, userId: string) {
    await this.devicesService.findOneByUser(deviceId, userId);

    return this.prisma.securityScore.findMany({
      where: { deviceId, userId },
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });
  }

  async getLatest(deviceId: string, userId: string) {
    await this.devicesService.findOneByUser(deviceId, userId);

    return this.prisma.securityScore.findFirst({
      where: { deviceId, userId },
      orderBy: { calculatedAt: 'desc' },
    });
  }
}
