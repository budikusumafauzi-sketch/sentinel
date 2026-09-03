import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { CreateRecommendationDto } from './dto';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async create(userId: string, dto: CreateRecommendationDto) {
    // If linked to a finding, verify ownership through scan -> user chain
    if (dto.findingId) {
      const finding = await this.prisma.finding.findUnique({
        where: { id: dto.findingId },
        include: { scan: true },
      });
      if (!finding) {
        throw new NotFoundException('Finding not found');
      }
      if (finding.scan.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    return this.prisma.recommendation.create({
      data: {
        findingId: dto.findingId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        actionUrl: dto.actionUrl,
      },
    });
  }

  async findByFinding(findingId: string, userId: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      include: { scan: true },
    });
    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    if (finding.scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.recommendation.findMany({
      where: { findingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDevice(deviceId: string, userId: string) {
    await this.devicesService.findOneByUser(deviceId, userId);

    return this.prisma.recommendation.findMany({
      where: { deviceId },
      include: { finding: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const recommendation = await this.prisma.recommendation.findUnique({
      where: { id },
      include: { finding: { include: { scan: true } } },
    });
    if (!recommendation) {
      throw new NotFoundException('Recommendation not found');
    }
    // If linked to a finding, verify ownership
    if (recommendation.finding && recommendation.finding.scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return recommendation;
  }
}
