import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        userId,
        name: dto.name,
        platform: dto.platform,
        osVersion: dto.osVersion,
        model: dto.model,
        manufacturer: dto.manufacturer,
      },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: string, userId: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return device;
  }
}
