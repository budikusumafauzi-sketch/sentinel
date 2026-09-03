import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { CreateScanDto } from './dto';

@Injectable()
export class ScansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly devicesService: DevicesService,
  ) {}

  async create(userId: string, dto: CreateScanDto) {
    // Verify device ownership
    await this.devicesService.findOneByUser(dto.deviceId, userId);

    return this.prisma.scan.create({
      data: {
        userId,
        deviceId: dto.deviceId,
        type: dto.type ?? 'QUICK',
        status: 'PENDING',
      },
      include: { device: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.scan.findMany({
      where: { userId },
      include: { device: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: string, userId: string) {
    const scan = await this.prisma.scan.findUnique({
      where: { id },
      include: { device: true, findings: true },
    });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    if (scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return scan;
  }

  async syncEvidence(id: string, userId: string, dto: import('./dto').SyncEvidenceDto) {
    const scan = await this.findOneByUser(id, userId);

    // Update device metadata if provided
    if (dto.deviceInfo) {
      await this.prisma.device.update({
        where: { id: scan.deviceId },
        data: {
          lastSeenAt: new Date(),
          ...(dto.deviceInfo.model ? { model: dto.deviceInfo.model } : {}),
          ...(dto.deviceInfo.manufacturer ? { manufacturer: dto.deviceInfo.manufacturer } : {}),
          ...(dto.deviceInfo.osVersion ? { osVersion: dto.deviceInfo.osVersion } : {}),
        },
      });
    } else {
      await this.prisma.device.update({
        where: { id: scan.deviceId },
        data: { lastSeenAt: new Date() },
      });
    }

    return this.prisma.scan.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        summary: dto.summary ?? `Device inspection completed with ${dto.rawEvidence?.length ?? 0} evidence items`,
        rawEvidence: dto.rawEvidence as any,
        capabilities: dto.capabilities as any,
      },
      include: { device: true, findings: true },
    });
  }
}

