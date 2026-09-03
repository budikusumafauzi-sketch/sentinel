import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScansService } from '../src/scans/scans.service';
import { DevicesService } from '../src/devices/devices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SyncEvidenceDto } from '../src/scans/dto';

describe('ScansService — Evidence Synchronization', () => {
  let service: ScansService;
  let prisma: {
    scan: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
    device: {
      update: jest.Mock;
    };
  };

  const mockScanId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = 'user-123';
  const mockDeviceId = 'device-456';

  const mockEvidenceDto: SyncEvidenceDto = {
    rawEvidence: [
      {
        checkId: 'android.os.version',
        category: 'SYSTEM',
        checkName: 'Android Release Version',
        value: '15',
        trustState: 'VERIFIED',
        source: 'android.os.Build.VERSION.RELEASE',
        platform: 'ANDROID',
        timestamp: '2026-09-03T08:00:00.000Z',
        capabilityStatus: 'SUPPORTED',
      },
    ],
    capabilities: {
      device_metadata: 'SUPPORTED',
      application_discovery: 'PARTIALLY_SUPPORTED',
    },
    deviceInfo: {
      manufacturer: 'Google',
      model: 'Pixel 8a',
      osVersion: '15',
    },
    summary: 'Device inspection completed: 1 check verified',
  };

  beforeEach(async () => {
    prisma = {
      scan: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      device: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScansService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: DevicesService,
          useValue: {
            findOneByUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
  });

  it('should successfully synchronize evidence and complete scan', async () => {
    prisma.scan.findUnique.mockResolvedValue({
      id: mockScanId,
      userId: mockUserId,
      deviceId: mockDeviceId,
      status: 'PENDING',
    });

    prisma.device.update.mockResolvedValue({
      id: mockDeviceId,
      manufacturer: 'Google',
      model: 'Pixel 8a',
      osVersion: '15',
    });

    prisma.scan.update.mockResolvedValue({
      id: mockScanId,
      userId: mockUserId,
      deviceId: mockDeviceId,
      status: 'COMPLETED',
      completedAt: new Date(),
      summary: mockEvidenceDto.summary,
      rawEvidence: mockEvidenceDto.rawEvidence,
      capabilities: mockEvidenceDto.capabilities,
      device: { id: mockDeviceId, model: 'Pixel 8a' },
      findings: [],
    });

    const result = await service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto);

    expect(result.status).toBe('COMPLETED');
    expect(result.rawEvidence).toEqual(mockEvidenceDto.rawEvidence);
    expect(prisma.device.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockDeviceId },
        data: expect.objectContaining({
          model: 'Pixel 8a',
          manufacturer: 'Google',
          osVersion: '15',
        }),
      }),
    );
  });

  it('should throw ForbiddenException if scan does not belong to user', async () => {
    prisma.scan.findUnique.mockResolvedValue({
      id: mockScanId,
      userId: 'other-user',
      deviceId: mockDeviceId,
    });

    await expect(
      service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if scan does not exist', async () => {
    prisma.scan.findUnique.mockResolvedValue(null);

    await expect(
      service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto),
    ).rejects.toThrow(NotFoundException);
  });
});
