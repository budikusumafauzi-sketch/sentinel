import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { CreateFindingDto } from './dto';

@Injectable()
export class FindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async create(userId: string, dto: CreateFindingDto) {
    // Verify scan ownership
    const scan = await this.prisma.scan.findUnique({
      where: { id: dto.scanId },
    });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    if (scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.finding.create({
      data: {
        scanId: dto.scanId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        source: dto.source,
        confidence: dto.confidence,
        evidence: dto.evidence as any,
        explanation: dto.explanation,
        remediation: dto.remediation,
      },
    });
  }

  async findByScan(scanId: string, userId: string) {
    const scan = await this.prisma.scan.findUnique({ where: { id: scanId } });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    if (scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.finding.findMany({
      where: { scanId },
      include: { recommendations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDevice(deviceId: string, userId: string) {
    await this.devicesService.findOneByUser(deviceId, userId);

    return this.prisma.finding.findMany({
      where: { deviceId },
      include: { recommendations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id },
      include: { scan: true, recommendations: true },
    });
    if (!finding) {
      throw new NotFoundException('Finding not found');
    }
    if (finding.scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return finding;
  }
}
