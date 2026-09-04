import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ScansService } from '../src/scans/scans.service';
import { DevicesService } from '../src/devices/devices.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SyncEvidenceDto } from '../src/scans/dto';

describe('ScansService — Evidence Synchronization', () => {
  let service: ScansService;
  let prisma: any;
  let devicesService: any;

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
      {
        checkId: 'security.screen_lock',
        category: 'AUTHENTICATION',
        checkName: 'Screen Lock Configured',
        value: false,
        trustState: 'VERIFIED',
        source: 'KeyguardManager.isDeviceSecure()',
        platform: 'ANDROID',
        timestamp: '2026-09-03T08:00:00.000Z',
        capabilityStatus: 'SUPPORTED',
      },
    ],
    capabilities: {
      device_metadata: 'SUPPORTED',
      screen_lock: 'SUPPORTED',
    },
    deviceInfo: {
      manufacturer: 'Google',
      model: 'Pixel 8a',
      osVersion: '15',
    },
    summary: 'Device inspection completed: 2 checks verified',
  };

  beforeEach(async () => {
    const txMock = {
      scan: {
        update: jest.fn().mockResolvedValue({ id: mockScanId }),
      },
      finding: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'finding-1' }),
      },
      recommendation: {
        create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      },
      securityScore: {
        create: jest.fn().mockResolvedValue({ id: 'score-1' }),
      },
      securityHistory: {
        create: jest.fn().mockResolvedValue({ id: 'hist-1' }),
      },
      securityEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      },
    };

    prisma = {
      scan: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      device: {
        update: jest.fn(),
      },
      finding: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      securityHistory: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb(txMock);
      }),
    };

    devicesService = {
      findOneByUser: jest.fn().mockResolvedValue({
        id: mockDeviceId,
        userId: mockUserId,
        name: 'Pixel 8a',
        platform: 'ANDROID',
      }),
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
          useValue: devicesService,
        },
      ],
    }).compile();

    service = module.get<ScansService>(ScansService);
  });

  it('should successfully synchronize evidence, execute security engine, and complete scan', async () => {
    prisma.scan.findUnique
      .mockResolvedValueOnce({
        id: mockScanId,
        userId: mockUserId,
        deviceId: mockDeviceId,
        status: 'PENDING',
      })
      .mockResolvedValueOnce({
        id: mockScanId,
        userId: mockUserId,
        deviceId: mockDeviceId,
        status: 'COMPLETED',
        score: 75,
        completedAt: new Date(),
        summary: mockEvidenceDto.summary,
        rawEvidence: mockEvidenceDto.rawEvidence,
        capabilities: mockEvidenceDto.capabilities,
        device: { id: mockDeviceId, model: 'Pixel 8a' },
        findings: [{ id: 'finding-1', ruleId: 'SEC-SYS-SCREEN-LOCK', severity: 'HIGH' }],
        report: { status: 'COMPLETED', overallScore: 75 },
      });

    prisma.device.update.mockResolvedValue({
      id: mockDeviceId,
      manufacturer: 'Google',
      model: 'Pixel 8a',
      osVersion: '15',
    });

    const result = await service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto);

    expect(result).toBeDefined();
    expect(result!.status).toBe('COMPLETED');
    expect(result!.rawEvidence).toEqual(mockEvidenceDto.rawEvidence);
    expect(prisma.$transaction).toHaveBeenCalled();
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

    await expect(service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw NotFoundException if scan does not exist', async () => {
    prisma.scan.findUnique.mockResolvedValue(null);

    await expect(service.syncEvidence(mockScanId, mockUserId, mockEvidenceDto)).rejects.toThrow(
      NotFoundException,
    );
  });
});
