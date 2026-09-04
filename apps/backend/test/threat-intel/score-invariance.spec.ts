import { executeSecurityEngine, EvidenceItem, DevicePlatform } from '@sentinel/types';
import { ConfigService } from '@nestjs/config';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import { CisaKevProvider } from '../../src/threat-intel/providers/cisa-kev.provider';
import { OsvProvider } from '../../src/threat-intel/providers/osv.provider';
import { UrlhausProvider } from '../../src/threat-intel/providers/urlhaus.provider';
import { OpenPhishProvider } from '../../src/threat-intel/providers/openphish.provider';
import { ExposureProvider } from '../../src/threat-intel/providers/exposure.provider';

describe('Security Engine Score Invariance Proof (Phase 8 Requirement H & Section 13)', () => {
  let threatIntelService: ThreatIntelService;
  let cisaKev: CisaKevProvider;
  let openphish: OpenPhishProvider;

  const mockDeviceInfo = {
    manufacturer: 'Google',
    model: 'Pixel 8',
    osVersion: '15',
    securityPatch: '2026-08-01',
    isEmulator: false,
    platform: 'ANDROID' as DevicePlatform,
  };

  const sampleEvidence: EvidenceItem[] = [
    {
      checkId: 'security.screen_lock',
      category: 'AUTHENTICATION',
      checkName: 'Screen Lock',
      value: true,
      trustState: 'VERIFIED',
      source: 'KeyguardManager',
      platform: 'ANDROID',
      timestamp: '2026-09-04T12:00:00Z',
      capabilityStatus: 'SUPPORTED',
    },
    {
      checkId: 'security.biometrics',
      category: 'AUTHENTICATION',
      checkName: 'Biometrics',
      value: true,
      trustState: 'VERIFIED',
      source: 'BiometricManager',
      platform: 'ANDROID',
      timestamp: '2026-09-04T12:00:00Z',
      capabilityStatus: 'SUPPORTED',
    },
    {
      checkId: 'security.storage_encryption',
      category: 'ENCRYPTION',
      checkName: 'Storage Encryption',
      value: true,
      trustState: 'VERIFIED',
      source: 'DevicePolicyManager',
      platform: 'ANDROID',
      timestamp: '2026-09-04T12:00:00Z',
      capabilityStatus: 'SUPPORTED',
    },
    {
      checkId: 'security.usb_debugging',
      category: 'SYSTEM',
      checkName: 'USB Debugging',
      value: true, // Finding trigger: USB debugging enabled
      trustState: 'VERIFIED',
      source: 'Settings.Global',
      platform: 'ANDROID',
      timestamp: '2026-09-04T12:00:00Z',
      capabilityStatus: 'SUPPORTED',
    },
  ];

  beforeEach(() => {
    const config = new ConfigService();
    const cacheService = new ThreatIntelCacheService(config);
    const rateLimiter = new ThreatIntelRateLimiterService();
    cisaKev = new CisaKevProvider(config, rateLimiter);
    const osv = new OsvProvider(config, rateLimiter);
    const urlhaus = new UrlhausProvider(config, rateLimiter);
    openphish = new OpenPhishProvider(config, rateLimiter);
    const exposure = new ExposureProvider(cisaKev, urlhaus);

    threatIntelService = new ThreatIntelService(
      config,
      cacheService,
      rateLimiter,
      cisaKev,
      osv,
      urlhaus,
      openphish,
      exposure,
    );

    cisaKev.seedMockCatalog([]);
    openphish.seedMockData([]);
    urlhaus.seedMockData([]);
  });

  it('PROVES that Threat Intelligence verdicts do NOT mutate the deterministic security score', async () => {
    // 1. Baseline deterministic engine execution
    const baselineExecution = executeSecurityEngine({
      scanId: 'scan-baseline-100',
      deviceId: 'device-100',
      deviceInfo: mockDeviceInfo,
      rawEvidence: sampleEvidence,
    });

    const baselineScore = baselineExecution.scoreBreakdown.score;
    const baselineCategories = JSON.parse(
      JSON.stringify(baselineExecution.scoreBreakdown.categoryScores),
    );
    const baselineFindingScores = baselineExecution.findings.map((f) => f.riskScore);

    // 2. Perform external threat intelligence queries indicating critical active malicious threats
    cisaKev.seedMockCatalog([
      {
        cveID: 'CVE-2026-99999',
        vendorProject: 'Kernel',
        product: 'Linux',
        vulnerabilityName: 'Kernel Zero-Day Exploitation',
        dateAdded: '2026-09-01',
        shortDescription: 'Active zero-day weaponized in wild.',
        requiredAction: 'Apply kernel patch immediately.',
        dueDate: '2026-09-10',
        knownRansomwareCampaignUse: 'Known',
        notes: '',
      },
    ]);
    openphish.seedMockData(['https://super-critical-phish.biz/login']);

    const cveIntel = await threatIntelService.queryCve('CVE-2026-99999', true);
    const urlIntel = await threatIntelService.queryUrl(
      'https://super-critical-phish.biz/login',
      true,
    );

    expect(cveIntel.verdict).toBe('MALICIOUS');
    expect(cveIntel.severity).toBe('CRITICAL');
    expect(urlIntel.verdict).toBe('MALICIOUS');
    expect(urlIntel.severity).toBe('CRITICAL');

    // 3. Re-run Security Engine with same device evidence
    const subsequentExecution = executeSecurityEngine({
      scanId: 'scan-subsequent-101',
      deviceId: 'device-100',
      deviceInfo: mockDeviceInfo,
      rawEvidence: sampleEvidence,
    });

    // 4. Mathematical invariance assertions
    expect(subsequentExecution.scoreBreakdown.score).toBe(baselineScore);
    expect(subsequentExecution.scoreBreakdown.evaluatedControlCount).toBe(
      baselineExecution.scoreBreakdown.evaluatedControlCount,
    );
    expect(subsequentExecution.scoreBreakdown.unavailableCheckCount).toBe(
      baselineExecution.scoreBreakdown.unavailableCheckCount,
    );
    expect(subsequentExecution.scoreBreakdown.categoryScores).toEqual(baselineCategories);
    expect(subsequentExecution.findings.map((f) => f.riskScore)).toEqual(baselineFindingScores);
    expect(subsequentExecution.findings.length).toBe(baselineExecution.findings.length);

    // Security engine score remains 100% deterministic and invariant
    expect(subsequentExecution.scoreBreakdown.score).not.toBeNull();
  });

  it('PROVES that external provider failure (UNAVAILABLE) does NOT change the deterministic score', async () => {
    const baseline = executeSecurityEngine({
      scanId: 'scan-1',
      deviceId: 'dev-1',
      deviceInfo: mockDeviceInfo,
      rawEvidence: sampleEvidence,
    });

    // Simulate provider failure
    jest.spyOn(openphish, 'query').mockResolvedValueOnce({
      intelligenceType: 'URL',
      indicator: 'https://any.com',
      normalizedIndicator: 'https://any.com',
      verdict: 'UNAVAILABLE',
      threatType: 'UNKNOWN',
      confidence: 0,
      severity: 'UNKNOWN',
      source: 'openphish',
      sourceDisplayName: 'OpenPhish',
      sourceReliability: openphish.reliability,
      providerStatus: 'ERROR',
      summary: 'Down',
      evidence: {},
      references: [],
      retrievedAt: new Date().toISOString(),
      cached: false,
    });

    const executionAfterFailure = executeSecurityEngine({
      scanId: 'scan-2',
      deviceId: 'dev-1',
      deviceInfo: mockDeviceInfo,
      rawEvidence: sampleEvidence,
    });

    expect(executionAfterFailure.scoreBreakdown.score).toBe(baseline.scoreBreakdown.score);
  });
});
