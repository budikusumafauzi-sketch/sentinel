import { ConfigService } from '@nestjs/config';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import { CisaKevProvider } from '../../src/threat-intel/providers/cisa-kev.provider';
import { OsvProvider } from '../../src/threat-intel/providers/osv.provider';
import { UrlhausProvider } from '../../src/threat-intel/providers/urlhaus.provider';
import { OpenPhishProvider } from '../../src/threat-intel/providers/openphish.provider';
import { ExposureProvider } from '../../src/threat-intel/providers/exposure.provider';
import type { ThreatIntelProvider } from '../../src/threat-intel/interfaces/threat-intel-provider.interface';
import type { ThreatIntelResult, SourceReliability } from '@sentinel/types';

describe('Threat Intelligence Abstraction & Provider Registry (Phase 8 Requirement A)', () => {
  let service: ThreatIntelService;
  let cacheService: ThreatIntelCacheService;
  let rateLimiter: ThreatIntelRateLimiterService;
  let cisaKev: CisaKevProvider;
  let osv: OsvProvider;
  let urlhaus: UrlhausProvider;
  let openphish: OpenPhishProvider;
  let exposure: ExposureProvider;

  beforeEach(() => {
    const config = new ConfigService();
    cacheService = new ThreatIntelCacheService(config);
    rateLimiter = new ThreatIntelRateLimiterService();
    cisaKev = new CisaKevProvider(config, rateLimiter);
    osv = new OsvProvider(config, rateLimiter);
    urlhaus = new UrlhausProvider(config, rateLimiter);
    openphish = new OpenPhishProvider(config, rateLimiter);
    exposure = new ExposureProvider(cisaKev, urlhaus);

    service = new ThreatIntelService(
      config,
      cacheService,
      rateLimiter,
      cisaKev,
      osv,
      urlhaus,
      openphish,
      exposure,
    );
  });

  it('registers all default approved providers on initialization', () => {
    const providers = service.getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(5);

    const ids = providers.map((p) => p.id);
    expect(ids).toContain('cisa_kev');
    expect(ids).toContain('osv');
    expect(ids).toContain('urlhaus');
    expect(ids).toContain('openphish');
    expect(ids).toContain('exposure');
  });

  it('resolves providers by specific intelligence type', () => {
    const urlProviders = service.getProvidersForType('URL');
    expect(urlProviders.some((p) => p.id === 'urlhaus')).toBe(true);
    expect(urlProviders.some((p) => p.id === 'openphish')).toBe(true);
    expect(urlProviders.some((p) => p.id === 'cisa_kev')).toBe(false);

    const cveProviders = service.getProvidersForType('CVE');
    expect(cveProviders.some((p) => p.id === 'cisa_kev')).toBe(true);
    expect(cveProviders.some((p) => p.id === 'osv')).toBe(true);
  });

  it('resolves provider by unique identifier', () => {
    const provider = service.getProvider('cisa_kev');
    expect(provider).toBeDefined();
    expect(provider?.displayName).toContain('CISA');
    expect(provider?.reliability.authorityLevel).toBe('AUTHORITATIVE_GOVERNMENT');
    expect(provider?.reliability.isAuthoritative).toBe(true);
  });

  it('supports dynamically registering a new modular provider without altering business logic', async () => {
    const customReliability: SourceReliability = {
      authorityLevel: 'COMMERCIAL_FEED',
      reliabilityScore: 0.85,
      isAuthoritative: false,
      description: 'Custom threat intelligence provider test adapter.',
    };

    const mockProvider: ThreatIntelProvider = {
      id: 'custom_intel_feed',
      name: 'custom_intel_feed',
      displayName: 'Custom Threat Feed',
      supportedTypes: ['URL'],
      reliability: customReliability,
      attribution: 'Custom attribution',
      isConfigured: () => true,
      getDescriptor: () => ({
        id: 'custom_intel_feed',
        name: 'Custom Threat Feed',
        supportedTypes: ['URL'],
        reliability: customReliability,
        isConfigured: true,
        isHealthy: true,
        attribution: 'Custom attribution',
      }),
      query: async (indicator, type) => ({
        intelligenceType: type,
        indicator,
        normalizedIndicator: indicator,
        verdict: 'SUSPICIOUS',
        threatType: 'SUSPICIOUS_REPUTATION',
        confidence: 0.75,
        severity: 'MEDIUM',
        source: 'custom_intel_feed',
        sourceDisplayName: 'Custom Threat Feed',
        sourceReliability: customReliability,
        providerStatus: 'SUCCESS',
        summary: 'Flagged by custom provider',
        evidence: { test: true },
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      }),
    };

    service.registerProvider(mockProvider);
    const resolved = service.getProvider('custom_intel_feed');
    expect(resolved).toBeDefined();
    expect(resolved?.id).toBe('custom_intel_feed');

    const result = await resolved!.query('https://test-indicator.xyz', 'URL');
    expect(result.verdict).toBe('SUSPICIOUS');
    expect(result.sourceReliability.authorityLevel).toBe('COMMERCIAL_FEED');
    expect(result.sourceReliability.isAuthoritative).toBe(false);
  });

  it('validates normalized intelligence result contract adherence', async () => {
    // Seed mock data in CISA KEV
    cisaKev.seedMockCatalog([
      {
        cveID: 'CVE-2023-99999',
        vendorProject: 'TestVendor',
        product: 'TestProduct',
        vulnerabilityName: 'Test RCE Vulnerability',
        dateAdded: '2023-01-01',
        shortDescription: 'Critical remote code execution',
        requiredAction: 'Apply patch immediately',
        dueDate: '2023-01-15',
        knownRansomwareCampaignUse: 'Known',
        notes: 'https://example.com/advisory',
      },
    ]);

    const result: ThreatIntelResult = await service.queryCve('CVE-2023-99999', true);

    // Strict contract shape checks
    expect(result).toHaveProperty('intelligenceType', 'CVE');
    expect(result).toHaveProperty('indicator');
    expect(result).toHaveProperty('normalizedIndicator', 'CVE-2023-99999');
    expect(result).toHaveProperty('verdict', 'MALICIOUS');
    expect(result).toHaveProperty('threatType', 'RANSOMWARE');
    expect(result).toHaveProperty('confidence', 1.0);
    expect(result).toHaveProperty('severity', 'CRITICAL');
    expect(result).toHaveProperty('source');
    expect(result).toHaveProperty('sourceReliability');
    expect(result.sourceReliability.isAuthoritative).toBe(true);
    expect(result).toHaveProperty('providerStatus', 'SUCCESS');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('references');
    expect(Array.isArray(result.references)).toBe(true);
    expect(result).toHaveProperty('retrievedAt');
    expect(result).toHaveProperty('cached');
  });
});
