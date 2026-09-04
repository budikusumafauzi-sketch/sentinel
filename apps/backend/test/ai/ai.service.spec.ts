import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../../src/ai/ai.service';
import { PromptRegistry } from '../../src/ai/prompts/prompt-registry';
import { OutputValidator } from '../../src/ai/validation/output-validator';
import { MockAiProvider } from '../../src/ai/providers/mock.provider';
import { AI_PROVIDER_TOKEN } from '../../src/ai/interfaces/ai-provider.interface';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotFoundException, ForbiddenException, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiProviderError } from '../../src/ai/providers/gemini.provider';

describe('AiService (Central AI Intelligence Layer)', () => {
  let aiService: AiService;
  let mockProvider: MockAiProvider;
  let prismaService: any;

  const mockUser = { id: 'user-123', email: 'user@example.com' };
  const otherUser = { id: 'user-other', email: 'other@example.com' };

  const mockFinding = {
    id: 'finding-1',
    scanId: 'scan-1',
    deviceId: 'device-1',
    category: 'SYSTEM',
    title: 'Unencrypted Drive',
    description: 'C: drive encryption is disabled.',
    severity: 'HIGH',
    status: 'OPEN',
    confidence: 1.0,
    evidence: [
      { label: 'Drive', value: 'C:' },
      { label: 'BitLockerStatus', value: 'Decrypted' },
      { label: 'AdminPassword', value: 'super-secret-password-123' }, // Should be scrubbed!
      { label: 'MachineGuid', value: '11111111-2222-3333-4444-555555555555' }, // Should be scrubbed!
    ],
    scan: {
      id: 'scan-1',
      userId: mockUser.id,
      deviceId: 'device-1',
    },
  };

  const mockDevice = {
    id: 'device-1',
    userId: mockUser.id,
    name: 'Work Laptop',
    platform: 'WINDOWS',
    osVersion: 'Windows 11 Pro',
    model: 'Dell XPS 15',
    securityScores: [
      {
        overallScore: 82,
        evaluatedControlCount: 14,
        unavailableCheckCount: 2,
      },
    ],
  };

  beforeEach(async () => {
    mockProvider = new MockAiProvider();
    mockProvider.setMockHandler(null);
    mockProvider.setConfigured(true);

    prismaService = {
      finding: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockFinding.id) return Promise.resolve(mockFinding);
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([mockFinding]),
      },
      device: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockDevice.id) return Promise.resolve(mockDevice);
          return Promise.resolve(null);
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        PromptRegistry,
        OutputValidator,
        {
          provide: AI_PROVIDER_TOKEN,
          useValue: mockProvider,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    aiService = module.get<AiService>(AiService);
  });

  describe('explainFinding', () => {
    it('successfully explains a verified finding and preserves provenance', async () => {
      const result = await aiService.explainFinding(mockUser.id, mockFinding.id);

      expect(result).toBeDefined();
      expect(result.findingId).toBe(mockFinding.id);
      expect(result.summary).toBeDefined();
      expect(result.promptVersion).toBe('SECURITY_EXPLANATION_V1');
      expect(result.provenance.deterministicEngineAuthoritative).toBe(true);
      expect(result.provenance.aiInterpretationOnly).toBe(true);
      expect(result.provenance.sourceEvidenceVerified).toBe(true);
    });

    it('enforces privacy boundary by scrubbing passwords and machineguid before AI call', async () => {
      let promptSent = '';
      mockProvider.setMockHandler(async (req) => {
        promptSent = req.prompt;
        return {
          summary: 'Scrubbed check summary',
          explanation: 'Explanation',
          whyItMatters: 'Why',
          evidenceReferences: ['Drive', 'BitLockerStatus'],
          impact: 'Impact',
          remediation: 'Remediation',
          limitations: ['Limitation'],
          confidence: 0.95,
        };
      });

      await aiService.explainFinding(mockUser.id, mockFinding.id);

      expect(promptSent).not.toContain('super-secret-password-123');
      expect(promptSent).not.toContain('11111111-2222-3333-4444-555555555555');
      expect(promptSent).toContain('BitLockerStatus');
    });

    it('rejects request with NotFoundException when finding does not exist', async () => {
      await expect(aiService.explainFinding(mockUser.id, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects request with ForbiddenException when finding belongs to another user', async () => {
      await expect(aiService.explainFinding(otherUser.id, mockFinding.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getSecurityAdvisor', () => {
    it('returns prioritized recommendations for a device', async () => {
      const result = await aiService.getSecurityAdvisor(mockUser.id, mockDevice.id);

      expect(result).toBeDefined();
      expect(result.promptVersion).toBe('SECURITY_ADVISOR_V1');
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.provenance.deterministicEngineAuthoritative).toBe(true);
    });

    it('rejects request with ForbiddenException when device belongs to another user', async () => {
      await expect(aiService.getSecurityAdvisor(otherUser.id, mockDevice.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('analyzeThreat & analyzeMessage & analyzeUrl & analyzeScreenshot', () => {
    it('analyzes threat input and returns structured assessment', async () => {
      const result = await aiService.analyzeThreat(mockUser.id, {
        threatInput: 'Your bank account will be closed unless you verify now.',
      });

      expect(result.classification).toBeDefined();
      expect(result.promptVersion).toBe('THREAT_ANALYZER_V1');
      expect(result.provenance.aiInterpretationOnly).toBe(true);
    });

    it('analyzes suspicious message and detects phishing cues', async () => {
      const result = await aiService.analyzeMessage(mockUser.id, {
        messageText: 'Klik link untuk membatalkan transaksi: http://phish.example.com',
      });

      expect(result.classification).toBe('PHISHING');
      expect(result.promptVersion).toBe('MESSAGE_ANALYZER_V1');
      expect(result.urgencyTacticsDetected).toBe(true);
    });

    it('analyzes URL structure safely', async () => {
      const result = await aiService.analyzeUrl(mockUser.id, {
        url: 'http://secure-login-update.com/verify-account',
      });

      expect(result.domain).toBe('secure-login-update.com');
      expect(result.promptVersion).toBe('URL_ANALYZER_V1');
      expect(result.riskLevel).toBe('HIGH');
    });

    it('analyzes valid screenshot base64 image in memory', async () => {
      const result = await aiService.analyzeScreenshot(mockUser.id, {
        imageBase64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
        contextNote: 'Suspicious pop-up window',
      });

      expect(result.detectedElements).toBeDefined();
      expect(result.promptVersion).toBe('SCREENSHOT_ANALYZER_V1');
      expect(result.isContentSufficient).toBe(true);
    });
  });

  describe('Error Classification & Failure Degradation', () => {
    it('handles rate limit error from provider with 429 status and retryable flag', async () => {
      mockProvider.setMockHandler(async () => {
        throw new GeminiProviderError('Rate limit exceeded', 'RATE_LIMIT', 429, true);
      });

      try {
        await aiService.explainFinding(mockUser.id, mockFinding.id);
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        const res = err.getResponse();
        expect(res.error.code).toBe('RATE_LIMIT');
        expect(res.error.retryable).toBe(true);
      }
    });

    it('handles timeout error from provider with 504 status', async () => {
      mockProvider.setMockHandler(async () => {
        throw new GeminiProviderError('Request timed out', 'TIMEOUT', 504, true);
      });

      try {
        await aiService.explainFinding(mockUser.id, mockFinding.id);
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT);
        const res = err.getResponse();
        expect(res.error.code).toBe('TIMEOUT');
      }
    });

    it('handles unconfigured provider with 503 status and CONFIG_MISSING code', async () => {
      mockProvider.setConfigured(false);

      try {
        await aiService.explainFinding(mockUser.id, mockFinding.id);
        fail('Should have thrown HttpException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HttpException);
        expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        const res = err.getResponse();
        expect(res.error.code).toBe('CONFIG_MISSING');
      }
    });
  });
});
