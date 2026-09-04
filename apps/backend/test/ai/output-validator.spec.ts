import { OutputValidator, OutputValidationError } from '../../src/ai/validation/output-validator';
import { PROMPT_VERSIONS } from '@sentinel/types';

describe('OutputValidator (Security Boundary & Schema Validation)', () => {
  let validator: OutputValidator;

  beforeEach(() => {
    validator = new OutputValidator();
  });

  describe('validateSecurityExplanation', () => {
    it('validates a correct security explanation result', () => {
      const raw = {
        summary: 'Unencrypted drive detected.',
        explanation: 'BitLocker device encryption is currently inactive on C:.',
        whyItMatters: 'Physical theft of the machine allows offline data reading.',
        evidenceReferences: ['bitlocker_status'],
        impact: 'Data confidentiality loss.',
        remediation: 'Turn on BitLocker in Control Panel.',
        limitations: ['Verified via local WMI only.'],
        confidence: 0.95,
      };

      const result = validator.validateSecurityExplanation(
        raw,
        'finding-123',
        PROMPT_VERSIONS.SECURITY_EXPLANATION,
        { provider: 'mock-gemini', model: 'mock-model' },
        true,
      );

      expect(result.findingId).toBe('finding-123');
      expect(result.summary).toBe(raw.summary);
      expect(result.confidence).toBe(0.95);
      expect(result.provenance.deterministicEngineAuthoritative).toBe(true);
      expect(result.provenance.aiInterpretationOnly).toBe(true);
      expect(result.provenance.sourceEvidenceVerified).toBe(true);
    });

    it('strips and rejects attempted score alterations at the boundary', () => {
      const raw = {
        summary: 'Firewall disabled.',
        explanation: 'Firewall is turned off.',
        whyItMatters: 'Inbound network connections are unmonitored.',
        evidenceReferences: ['firewall_status'],
        impact: 'Exposure to network probes.',
        remediation: 'Enable Windows Firewall.',
        limitations: ['Domain profile only.'],
        confidence: 0.9,
        // Model attempts to modify deterministic score:
        score: 42,
        securityScore: 80,
        riskScore: 99,
      };

      const result = validator.validateSecurityExplanation(
        raw,
        'finding-123',
        PROMPT_VERSIONS.SECURITY_EXPLANATION,
        { provider: 'mock-gemini', model: 'mock-model' },
        true,
      );

      expect((result as any).score).toBeUndefined();
      expect((result as any).securityScore).toBeUndefined();
      expect((result as any).riskScore).toBeUndefined();
      expect(result.provenance.deterministicEngineAuthoritative).toBe(true);
    });

    it('throws OutputValidationError when required fields are missing', () => {
      const raw = {
        summary: 'Missing explanation fields',
      };

      expect(() => {
        validator.validateSecurityExplanation(
          raw,
          'finding-123',
          PROMPT_VERSIONS.SECURITY_EXPLANATION,
          { provider: 'mock', model: 'mock' },
          true,
        );
      }).toThrow(OutputValidationError);
    });

    it('throws OutputValidationError when confidence is out of range [0, 1]', () => {
      const raw = {
        summary: 'Test summary',
        explanation: 'Test explanation',
        whyItMatters: 'Test why',
        evidenceReferences: ['ev1'],
        impact: 'Test impact',
        remediation: 'Test remediation',
        limitations: ['Test limit'],
        confidence: 1.5, // Invalid!
      };

      expect(() => {
        validator.validateSecurityExplanation(
          raw,
          'finding-123',
          PROMPT_VERSIONS.SECURITY_EXPLANATION,
          { provider: 'mock', model: 'mock' },
          true,
        );
      }).toThrow(OutputValidationError);
    });
  });

  describe('validateSecurityAdvisor', () => {
    it('validates structured recommendations and drops fabricated finding references', () => {
      const raw = {
        recommendations: [
          {
            recommendation: 'Enable BitLocker',
            rationale: 'Protects offline data',
            priority: 'HIGH',
            affectedFindingId: 'fabricated-finding-id-999',
            affectedControl: 'Disk Encryption',
            evidenceReferences: ['ref1'],
            steps: ['Step 1'],
            limitations: ['Admin required'],
            confidence: 0.9,
          },
        ],
        overallGuidance: 'High-level posture focus.',
        priorityRationale: 'Encryption is top priority.',
        limitations: ['Limited to synced findings.'],
        confidence: 0.9,
      };

      const validFindingIds = new Set(['finding-real-1', 'finding-real-2']);
      const result = validator.validateSecurityAdvisor(
        raw,
        PROMPT_VERSIONS.SECURITY_ADVISOR,
        { provider: 'mock', model: 'mock' },
        validFindingIds,
      );

      expect(result.recommendations).toHaveLength(1);
      // Fabricated finding ID was filtered out
      expect(result.recommendations[0]?.affectedFindingId).toBeUndefined();
      expect(result.recommendations[0]?.priority).toBe('HIGH');
    });

    it('rejects invalid priority enums in recommendations', () => {
      const raw = {
        recommendations: [
          {
            recommendation: 'Fix stuff',
            rationale: 'Because security',
            priority: 'SUPER_CRITICAL_URGENT', // Invalid!
            evidenceReferences: [],
            steps: [],
            limitations: [],
            confidence: 0.8,
          },
        ],
        overallGuidance: 'Guidance',
        priorityRationale: 'Rationale',
        limitations: [],
        confidence: 0.8,
      };

      expect(() => {
        validator.validateSecurityAdvisor(
          raw,
          PROMPT_VERSIONS.SECURITY_ADVISOR,
          { provider: 'mock', model: 'mock' },
          new Set(),
        );
      }).toThrow(OutputValidationError);
    });
  });

  describe('validateThreatAnalysis', () => {
    it('validates threat analysis with valid enums', () => {
      const raw = {
        classification: 'SUSPICIOUS',
        riskInterpretation: 'Potential credential harvesting tactic.',
        indicators: ['Urgency marker', 'Unknown domain'],
        explanation: 'Detailed explanation.',
        confidence: 0.85,
        evidence: ['Urgent token'],
        limitations: ['Text only'],
      };

      const result = validator.validateThreatAnalysis(raw, PROMPT_VERSIONS.THREAT_ANALYZER, {
        provider: 'mock',
        model: 'mock',
      });

      expect(result.classification).toBe('SUSPICIOUS');
      expect(result.confidence).toBe(0.85);
      expect(result.provenance.aiInterpretationOnly).toBe(true);
    });

    it('rejects unsupported threat classification enum', () => {
      const raw = {
        classification: 'DEFINITELY_HACKED_ZERO_DAY', // Invalid enum
        riskInterpretation: 'Risk',
        indicators: [],
        explanation: 'Exp',
        confidence: 0.5,
        evidence: [],
        limitations: [],
      };

      expect(() => {
        validator.validateThreatAnalysis(raw, PROMPT_VERSIONS.THREAT_ANALYZER, {
          provider: 'mock',
          model: 'mock',
        });
      }).toThrow(OutputValidationError);
    });
  });

  describe('validateMessageAnalysis', () => {
    it('validates phishing message analysis', () => {
      const raw = {
        classification: 'PHISHING',
        suspiciousIndicators: ['Urgency', 'Fake banking domain'],
        explanation: 'Social engineering attack.',
        urgencyTacticsDetected: true,
        credentialHarvestingRisk: true,
        recommendedAction: 'Block and report.',
        confidence: 0.95,
        limitations: ['Headers not checked'],
      };

      const result = validator.validateMessageAnalysis(raw, PROMPT_VERSIONS.MESSAGE_ANALYZER, {
        provider: 'mock',
        model: 'mock',
      });

      expect(result.classification).toBe('PHISHING');
      expect(result.urgencyTacticsDetected).toBe(true);
      expect(result.credentialHarvestingRisk).toBe(true);
    });
  });

  describe('validateUrlAnalysis', () => {
    it('validates normalized URL analysis structure', () => {
      const raw = {
        observations: ['Typosquatting detected'],
        riskInterpretation: 'High risk impersonation domain',
        riskLevel: 'HIGH',
        confidence: 0.88,
        limitations: ['Lexical analysis only'],
        sourceAttribution: 'Sentinel AI URL Orchestrator',
      };

      const result = validator.validateUrlAnalysis(
        raw,
        'https://secure-login-bank.fake.com',
        'secure-login-bank.fake.com',
        'https:',
        PROMPT_VERSIONS.URL_ANALYZER,
        { provider: 'mock', model: 'mock' },
      );

      expect(result.normalizedUrl).toBe('https://secure-login-bank.fake.com');
      expect(result.domain).toBe('secure-login-bank.fake.com');
      expect(result.riskLevel).toBe('HIGH');
    });
  });
});
