import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DevicesService } from '../devices/devices.service';
import { CreateScanDto, SyncEvidenceDto } from './dto';
import {
  executeSecurityEngine,
  EngineFinding,
  EvidenceItem,
  CompleteScanReport,
} from '@sentinel/types';

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
      include: {
        device: true,
        findings: true,
        securityScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByUser(id: string, userId: string) {
    const scan = await this.prisma.scan.findUnique({
      where: { id },
      include: {
        device: true,
        findings: {
          include: { recommendations: true },
        },
        securityScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!scan) {
      throw new NotFoundException('Scan not found');
    }
    if (scan.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return scan;
  }

  async getReport(id: string, userId: string): Promise<CompleteScanReport> {
    const scan = await this.findOneByUser(id, userId);
    if (!scan.report) {
      throw new NotFoundException('Scan report not generated yet');
    }
    return scan.report as unknown as CompleteScanReport;
  }

  async syncEvidence(id: string, userId: string, dto: SyncEvidenceDto) {
    const scan = await this.findOneByUser(id, userId);
    const device = await this.devicesService.findOneByUser(scan.deviceId, userId);

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

    // Retrieve previous completed or partial scan for this device
    const previousScan = await this.prisma.scan.findFirst({
      where: {
        deviceId: scan.deviceId,
        id: { not: scan.id },
        status: { in: ['COMPLETED', 'PARTIAL'] },
      },
      orderBy: { completedAt: 'desc' },
      include: { findings: true },
    });

    // Retrieve previous history record for trend calculation
    const previousHistory = await this.prisma.securityHistory.findFirst({
      where: { deviceId: scan.deviceId },
      orderBy: { recordedAt: 'desc' },
    });

    // Retrieve previously active findings for this device
    const previousActiveFindingsRecords = await this.prisma.finding.findMany({
      where: {
        deviceId: scan.deviceId,
        status: 'OPEN',
      },
    });

    const previousFindings: EngineFinding[] = previousActiveFindingsRecords.map((f) => ({
      id: f.id,
      fingerprint: f.fingerprint || '',
      scanId: f.scanId,
      deviceId: f.deviceId || scan.deviceId,
      ruleId: f.ruleId || '',
      rulesetVersion: f.rulesetVersion || '1.0.0',
      category: f.category as any,
      title: f.title,
      description: f.description || '',
      severity: f.severity as any,
      status: 'ACTIVE',
      source: f.source || 'Sentinel',
      platform: f.platform || device.platform,
      confidence: f.confidence ?? 1.0,
      riskScore: f.riskScore ?? 50,
      priority: (f.priority as any) ?? 'MEDIUM',
      rawRisk: f.riskScore ?? 50,
      dimensions: {
        severity: 3,
        impact: 3,
        likelihood: 3,
        exposure: 3,
        assetCriticality: 3,
        controlGap: 3,
      },
      evidence: f.evidence,
      explanation: f.explanation || '',
      recommendationText: f.remediation || '',
    }));

    // Find isEmulator from rawEvidence if present
    const rawEvidenceItems = (dto.rawEvidence || []) as unknown as EvidenceItem[];
    const isEmulatorItem = rawEvidenceItems.find((e) => e.checkId === 'device.is_emulator');
    const isEmulator = Boolean(isEmulatorItem?.value);

    // Extract security patch from evidence
    const patchItem = rawEvidenceItems.find((e) => e.checkId === 'os.security_patch');
    const securityPatch = typeof patchItem?.value === 'string' ? patchItem.value : null;

    const deviceInfo = {
      manufacturer: dto.deviceInfo?.manufacturer || device.manufacturer || 'Unknown',
      model: dto.deviceInfo?.model || device.model || 'Unknown',
      osVersion: dto.deviceInfo?.osVersion || device.osVersion || 'Unknown',
      securityPatch,
      isEmulator,
      platform: device.platform,
    };

    // Execute the Deterministic Security Engine
    const execution = executeSecurityEngine({
      scanId: scan.id,
      deviceId: scan.deviceId,
      deviceInfo,
      rawEvidence: rawEvidenceItems,
      previousFindings,
      previousHistory: previousHistory as any,
      previousScore: previousScan?.score ?? null,
      scanStartedAt: scan.startedAt?.toISOString() ?? new Date().toISOString(),
      scanCompletedAt: new Date().toISOString(),
    });

    // Write all security artifacts in an atomic transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Update the scan record with execution results
      await tx.scan.update({
        where: { id },
        data: {
          status: execution.report.status,
          completedAt: new Date(),
          score: execution.scoreBreakdown.score,
          evaluatedControls: execution.scoreBreakdown.evaluatedControlCount,
          unavailableChecks: execution.scoreBreakdown.unavailableCheckCount,
          summary: execution.report.summary,
          rawEvidence: dto.rawEvidence as any,
          capabilities: dto.capabilities as any,
          report: execution.report as any,
        },
      });

      // 2. Persist findings & resolve obsolete findings
      const createdFindingMap = new Map<string, string>();

      for (const finding of execution.findings) {
        if (finding.status === 'RESOLVED') {
          await tx.finding.updateMany({
            where: {
              deviceId: scan.deviceId,
              fingerprint: finding.fingerprint,
              status: 'OPEN',
            },
            data: {
              status: 'RESOLVED',
              resolvedAt: new Date(),
            },
          });
        } else if (finding.status === 'ACTIVE') {
          const createdFinding = await tx.finding.create({
            data: {
              scanId: scan.id,
              deviceId: scan.deviceId,
              fingerprint: finding.fingerprint,
              ruleId: finding.ruleId,
              rulesetVersion: finding.rulesetVersion,
              category: finding.category as any,
              title: finding.title,
              description: finding.description,
              severity: finding.severity as any,
              riskScore: finding.riskScore,
              priority: finding.priority,
              status: 'OPEN',
              source: finding.source,
              platform: finding.platform,
              confidence: finding.confidence,
              evidence: finding.evidence as any,
              explanation: finding.explanation,
              remediation: finding.recommendationText,
            },
          });
          createdFindingMap.set(finding.fingerprint, createdFinding.id);
        }
      }

      // 3. Persist Recommendations
      for (const rec of execution.recommendations) {
        const findingId = rec.findingFingerprint
          ? createdFindingMap.get(rec.findingFingerprint)
          : undefined;
        await tx.recommendation.create({
          data: {
            findingId: findingId ?? null,
            deviceId: scan.deviceId,
            findingFingerprint: rec.findingFingerprint,
            category: rec.category,
            title: rec.title,
            description: rec.description,
            priority: rec.priority as any,
            status: rec.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          },
        });
      }

      // 4. Persist Security Score
      await tx.securityScore.create({
        data: {
          userId,
          deviceId: scan.deviceId,
          scanId: scan.id,
          overallScore: execution.scoreBreakdown.score ?? 0,
          scoreVersion: execution.scoreBreakdown.scoreVersion,
          riskModelVersion: execution.scoreBreakdown.riskModelVersion,
          rulesetVersion: execution.scoreBreakdown.rulesetVersion,
          evaluatedControlCount: execution.scoreBreakdown.evaluatedControlCount,
          unavailableCheckCount: execution.scoreBreakdown.unavailableCheckCount,
          categoryScores: execution.scoreBreakdown.categoryScores as any,
          findingContributions: execution.scoreBreakdown.findingContributions as any,
        },
      });

      // 5. Persist Security History
      await tx.securityHistory.create({
        data: {
          userId,
          deviceId: scan.deviceId,
          scanId: scan.id,
          overallScore: execution.historyRecord.overallScore,
          categoryScores: execution.historyRecord.categoryScores as any,
          findingCounts: execution.historyRecord.findingCounts as any,
          evaluatedControls: execution.historyRecord.evaluatedControls,
          unavailableChecks: execution.historyRecord.unavailableChecks,
          coverage: execution.historyRecord.coverage,
          status: execution.historyRecord.status,
          trend: execution.historyRecord.trend,
          scoreDelta: execution.historyRecord.scoreDelta,
        },
      });

      // 6. Persist Security Events
      for (const ev of execution.events) {
        await tx.securityEvent.create({
          data: {
            userId,
            deviceId: scan.deviceId,
            scanId: scan.id,
            findingFingerprint: ev.findingFingerprint,
            type: ev.type,
            title: ev.title,
            description: ev.description,
            severity: ev.severity as any,
            metadata: ev.metadata as any,
          },
        });
      }
    });

    // Return the updated scan with complete data and report
    return this.prisma.scan.findUnique({
      where: { id },
      include: {
        device: true,
        findings: {
          include: { recommendations: true },
        },
        securityScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
