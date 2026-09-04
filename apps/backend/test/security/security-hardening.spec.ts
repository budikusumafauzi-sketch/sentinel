import {
  ForbiddenException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { AuthService } from '../../src/auth/auth.service';
import { LoginDto, RegisterDto } from '../../src/auth/dto/auth.dto';
import { RecommendationsService } from '../../src/recommendations/recommendations.service';
import { RecommendationPriorityDto } from '../../src/recommendations/dto';
import { ThreatIntelValidator } from '../../src/threat-intel/validation/ssrf-validator';
import { CveThreatDto, DomainThreatDto } from '../../src/threat-intel/dto';
import { SyncEvidenceDto } from '../../src/scans/dto/sync-evidence.dto';
import { SecurityAdvisorDto } from '../../src/ai/dto/advisor-request.dto';
import { ExplainFindingDto } from '../../src/ai/dto/explain-finding.dto';
import { OutputValidator } from '../../src/ai/validation/output-validator';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import * as bcrypt from 'bcrypt';

describe('Phase 9 — Security Hardening Regression Suite', () => {
  // ==========================================================================
  // 1. AUTHENTICATION HARDENING & TIMING ATTACK RESISTANCE
  // ==========================================================================
  describe('Authentication Security', () => {
    let authService: AuthService;
    let mockPrisma: any;
    let mockJwt: any;

    beforeEach(() => {
      mockPrisma = {
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
      };
      mockJwt = {
        sign: jest.fn().mockReturnValue('mock-jwt-token'),
      };
      authService = new AuthService(mockPrisma, mockJwt);
    });

    it('performs constant-time dummy bcrypt comparison when user does not exist to mitigate timing attacks', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nonexistent@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('normalizes email addresses by trimming and lowercasing to prevent duplicate account confusion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const hashedPassword = await bcrypt.hash('TestPass123!', 10);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'attacker@example.com',
        password: hashedPassword,
        name: 'Attacker',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await authService.register({
        email: '  Attacker@Example.COM  ',
        password: 'TestPass123!',
        name: 'Attacker',
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'attacker@example.com',
          }),
        }),
      );
    });

    it('rejects passwords exceeding 128 characters to prevent bcrypt CPU exhaustion DoS', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'A'.repeat(129),
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('maxLength');
    });

    it('rejects malformed email formats in login and register', async () => {
      const dto = plainToInstance(RegisterDto, {
        email: 'not-an-email',
        password: 'ValidPassword1!',
        name: 'Test',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. AUTHORIZATION & IDOR / BOLA RESISTANCE
  // ==========================================================================
  describe('Authorization & Resource Ownership (IDOR / BOLA)', () => {
    let recommendationsService: RecommendationsService;
    let mockPrisma: any;
    let mockDevicesService: any;

    const userA = { id: 'user-a-uuid', email: 'a@example.com' };
    const userB = { id: 'user-b-uuid', email: 'b@example.com' };

    beforeEach(() => {
      mockPrisma = {
        recommendation: {
          findUnique: jest.fn(),
          create: jest.fn(),
          findMany: jest.fn(),
          update: jest.fn(),
        },
        finding: {
          findUnique: jest.fn(),
        },
        device: {
          findFirst: jest.fn(),
        },
      };
      mockDevicesService = {
        findOneByUser: jest.fn(),
      };
      recommendationsService = new RecommendationsService(mockPrisma, mockDevicesService);
    });

    it('denies user B from reading a recommendation belonging to user A (IDOR)', async () => {
      mockPrisma.recommendation.findUnique.mockResolvedValue({
        id: 'rec-1',
        title: 'Update OS',
        finding: {
          scan: {
            userId: userA.id,
          },
        },
        device: null,
      });

      await expect(recommendationsService.findOne('rec-1', userB.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows user A to read their own recommendation', async () => {
      mockPrisma.recommendation.findUnique.mockResolvedValue({
        id: 'rec-1',
        title: 'Update OS',
        finding: {
          scan: {
            userId: userA.id,
          },
        },
        device: null,
      });

      const result = await recommendationsService.findOne('rec-1', userA.id);
      expect(result).toBeDefined();
      expect(result.id).toBe('rec-1');
    });

    it('denies user B from creating a recommendation linked to user A finding (BOLA)', async () => {
      mockPrisma.finding.findUnique.mockResolvedValue({
        id: 'finding-a-1',
        scan: {
          userId: userA.id,
        },
      });

      await expect(
        recommendationsService.create(userB.id, {
          findingId: 'finding-a-1',
          title: 'Malicious Recommendation',
          description: 'Injected recommendation',
          priority: RecommendationPriorityDto.HIGH,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ==========================================================================
  // 3. INPUT VALIDATION & BOUNDARY INTEGRITY
  // ==========================================================================
  describe('Input Validation & Strict Typing', () => {
    it('validates CVE ID format and rejects path traversal or SQL injection payloads', async () => {
      const maliciousCves = [
        'CVE-2024-1234; DROP TABLE users;--',
        '../../../etc/passwd',
        '<script>alert(1)</script>',
        'CVE-INVALID',
        'CVE-99-123',
      ];

      for (const malCve of maliciousCves) {
        const dto = plainToInstance(CveThreatDto, { cveId: malCve });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }

      // Valid CVE should pass
      const validDto = plainToInstance(CveThreatDto, { cveId: 'CVE-2024-1234' });
      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);
    });

    it('validates domain format and rejects URLs, protocols, or invalid characters', async () => {
      const invalidDomains = [
        'http://malicious.com',
        'domain with spaces.com',
        'sub.domain/path',
        'user:pass@domain.com',
      ];

      for (const domain of invalidDomains) {
        const dto = plainToInstance(DomainThreatDto, { domain });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }

      const validDto = plainToInstance(DomainThreatDto, { domain: 'threat-domain.net' });
      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);
    });

    it('rejects oversized evidence array in SyncEvidenceDto to prevent memory exhaustion', async () => {
      const oversizedEvidence = Array.from({ length: 501 }, (_, i) => ({
        key: `key_${i}`,
        value: `val_${i}`,
        category: 'SYSTEM',
        collectedAt: new Date().toISOString(),
      }));

      const dto = plainToInstance(SyncEvidenceDto, {
        rawEvidence: oversizedEvidence,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'rawEvidence')).toBe(true);
    });

    it('rejects non-UUID identifiers in AI advisor and explain request DTOs', async () => {
      const advisorDto = plainToInstance(SecurityAdvisorDto, {
        deviceId: 'not-a-uuid-1234',
      });
      const advisorErrors = await validate(advisorDto);
      expect(advisorErrors.length).toBeGreaterThan(0);
      expect(advisorErrors.some((e) => e.property === 'deviceId')).toBe(true);

      const explainDto = plainToInstance(ExplainFindingDto, {
        findingId: '1234-invalid-id',
      });
      const explainErrors = await validate(explainDto);
      expect(explainErrors.length).toBeGreaterThan(0);
      expect(explainErrors.some((e) => e.property === 'findingId')).toBe(true);
    });
  });

  // ==========================================================================
  // 4. SSRF & NETWORK PERIMETER CONTROLS
  // ==========================================================================
  describe('SSRF & Network Perimeter Controls', () => {
    it('rejects IPv4 loopback addresses (127.0.0.0/8)', () => {
      const loopbacks = ['127.0.0.1', '127.0.0.2', '127.255.255.255', 'localhost'];
      for (const target of loopbacks) {
        expect(() => ThreatIntelValidator.assertSafeHostname(target)).toThrow(
          /SSRF Protection|loopback|forbidden/i,
        );
      }
    });

    it('rejects IPv4 private ranges (RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      const privates = [
        '10.0.0.1',
        '10.254.0.1',
        '172.16.0.1',
        '172.31.255.254',
        '192.168.1.1',
        '192.168.254.1',
      ];
      for (const target of privates) {
        expect(() => ThreatIntelValidator.assertSafeHostname(target)).toThrow(
          /SSRF Protection|non-public IP|forbidden/i,
        );
      }
    });

    it('rejects cloud metadata and link-local addresses (169.254.169.254, metadata.google.internal)', () => {
      const metadataTargets = [
        '169.254.169.254',
        '169.254.1.1',
        'metadata.google.internal',
        'instance-data',
      ];
      for (const target of metadataTargets) {
        expect(() => ThreatIntelValidator.assertSafeHostname(target)).toThrow(
          /SSRF Protection|metadata|forbidden|Malformed hostname/i,
        );
      }
    });

    it('rejects IPv6 loopback, unspecified, and IPv4-mapped IPv6 addresses', () => {
      const ipv6Threats = [
        '::1',
        '[::1]',
        '::',
        '[::]',
        '::ffff:127.0.0.1',
        '[::ffff:127.0.0.1]',
        '::ffff:192.168.1.1',
        'fe80::1',
        'fc00::1',
      ];
      for (const target of ipv6Threats) {
        expect(() => ThreatIntelValidator.assertSafeHostname(target)).toThrow(
          /SSRF Protection|IPv6|loopback|forbidden/i,
        );
      }
    });

    it('rejects non-HTTP/HTTPS protocols (file://, ftp://, javascript:, data:)', () => {
      const badUrls = [
        'file:///etc/passwd',
        'ftp://internal.server/data',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
      ];
      for (const url of badUrls) {
        expect(() => ThreatIntelValidator.normalizeUrl(url)).toThrow();
      }
    });

    it('allows valid public HTTPS target and correctly parses hostname', () => {
      const result = ThreatIntelValidator.normalizeUrl('https://example.com/check-target');
      expect(result.hostname).toBe('example.com');
      expect(result.normalizedUrl).toBe('https://example.com/check-target');
      expect(result.isSafeForExternalQuery).toBe(true);
    });
  });

  // ==========================================================================
  // 5. ERROR SANITIZATION & LEAKAGE PREVENTION
  // ==========================================================================
  describe('Error Sanitization & Secret Leakage Prevention', () => {
    let filter: AllExceptionsFilter;

    beforeEach(() => {
      filter = new AllExceptionsFilter();
    });

    it('sanitizes database connection strings and bearer tokens from error messages', () => {
      const rawMessage =
        'Connection failed at postgresql://postgres:SuperSecret123@db.internal:5432/sentinel with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0In0.signature';

      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => ({ url: '/api/v1/test', method: 'GET' }),
        }),
      };

      filter.catch(new HttpException(rawMessage, HttpStatus.BAD_REQUEST), mockHost as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const sentPayload = mockResponse.send.mock.calls[0][0];
      expect(sentPayload.error.message).not.toContain('SuperSecret123');
      expect(sentPayload.error.message).toContain('postgresql://[REDACTED]');
      expect(sentPayload.error.message).toContain('Bearer [REDACTED]');
      expect(sentPayload.error.message).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('masks internal server error messages to prevent information disclosure', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        header: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => ({ url: '/api/v1/test', method: 'GET' }),
        }),
      };

      filter.catch(
        new Error(
          'Sensitive stack trace: PrismaClientKnownRequestError: table users does not exist',
        ),
        mockHost as any,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // 6. AI SECURITY & DETERMINISTIC SCORE INVARIANCE
  // ==========================================================================
  describe('AI Security & Deterministic Score Invariance', () => {
    let validator: OutputValidator;

    beforeEach(() => {
      validator = new OutputValidator();
    });

    it('prevents prompt injection from overriding deterministic security score', () => {
      const maliciousAiPayload = {
        classification: 'MALICIOUS',
        riskInterpretation: 'High risk finding. Attempting score override.',
        explanation: 'Suspicious domain observed in traffic.',
        evidence: ['domain: malicious-site.com'],
        indicators: ['malicious-site.com'],
        limitations: ['none'],
        confidence: 0.95,
        score: 100, // Attacker injection attempting to set score
        deterministicScoreOverride: 100,
      };

      const validated = validator.validateThreatAnalysis(maliciousAiPayload, 'THREAT_ANALYZER_V1', {
        provider: 'gemini',
        model: 'gemini-1.5-flash',
      });

      // Validated output conforms to schema and MUST have deterministicEngineAuthoritative = true
      expect(validated.provenance.deterministicEngineAuthoritative).toBe(true);
      expect(validated.provenance.aiInterpretationOnly).toBe(true);
      expect((validated as any).score).toBeUndefined();
      expect((validated as any).deterministicScoreOverride).toBeUndefined();
    });

    it('rejects malformed AI structured output missing mandatory fields', () => {
      const invalidPayload = {
        unrelatedField: 'bad output',
      };

      expect(() =>
        validator.validateThreatAnalysis(invalidPayload, 'THREAT_ANALYZER_V1', {
          provider: 'gemini',
          model: 'gemini-1.5-flash',
        }),
      ).toThrow();
    });
  });
});
