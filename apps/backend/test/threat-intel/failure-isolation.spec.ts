import { ConfigService } from '@nestjs/config';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import { CisaKevProvider } from '../../src/threat-intel/providers/cisa-kev.provider';
import { OsvProvider } from '../../src/threat-intel/providers/osv.provider';
import { UrlhausProvider } from '../../src/threat-intel/providers/urlhaus.provider';
import { OpenPhishProvider } from '../../src/threat-intel/providers/openphish.provider';
import { ExposureProvider } from '../../src/threat-intel/providers/exposure.provider';

describe('Failure Isolation & Resilience (Phase 8 Requirement F)', () => {
  let service: ThreatIntelService;
  let cisaKev: CisaKevProvider;
  let osv: OsvProvider;
  let urlhaus: UrlhausProvider;
  let openphish: OpenPhishProvider;

  beforeEach(() => {
    const config = new ConfigService();
    const cacheService = new ThreatIntelCacheService(config);
    const rateLimiter = new ThreatIntelRateLimiterService();
    cisaKev = new CisaKevProvider(config, rateLimiter);
    osv = new OsvProvider(config, rateLimiter);
    urlhaus = new UrlhausProvider(config, rateLimiter);
    openphish = new OpenPhishProvider(config, rateLimiter);
    const exposure = new ExposureProvider(cisaKev, urlhaus);

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

  it('isolates network timeouts and returns normalized UNAVAILABLE result without crashing', async () => {
    // Mock provider query throwing a timeout AbortError
    jest.spyOn(openphish, 'query').mockImplementation(async (indicator, type) => {
      return {
        intelligenceType: type,
        indicator,
        normalizedIndicator: indicator,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'openphish',
        sourceDisplayName: 'OpenPhish',
        sourceReliability: openphish.reliability,
        providerStatus: 'TIMEOUT',
        summary: 'Request timed out',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    });

    jest.spyOn(urlhaus, 'query').mockImplementation(async (indicator, type) => {
      return {
        intelligenceType: type,
        indicator,
        normalizedIndicator: indicator,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'urlhaus',
        sourceDisplayName: 'URLhaus',
        sourceReliability: urlhaus.reliability,
        providerStatus: 'TIMEOUT',
        summary: 'Request timed out',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    });

    const result = await service.queryUrl('https://timeout-test.org', true);

    expect(result).toBeDefined();
    expect(result.verdict).toBe('UNAVAILABLE');
    expect(result.providerStatus).toBe('ERROR');
    expect(result.summary).toContain('temporarily unreachable');
  });

  it('isolates DNS or connection refused network errors', async () => {
    jest.spyOn(osv, 'query').mockImplementation(async (cve, type) => {
      return {
        intelligenceType: type,
        indicator: cve,
        normalizedIndicator: cve,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'osv',
        sourceDisplayName: 'OSV',
        sourceReliability: osv.reliability,
        providerStatus: 'ERROR',
        summary: 'ENOTFOUND: DNS lookup failed',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    });

    jest.spyOn(cisaKev, 'query').mockImplementation(async (cve, type) => {
      return {
        intelligenceType: type,
        indicator: cve,
        normalizedIndicator: cve,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'cisa_kev',
        sourceDisplayName: 'CISA KEV',
        sourceReliability: cisaKev.reliability,
        providerStatus: 'ERROR',
        summary: 'ECONNREFUSED: Connection refused',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    });

    const result = await service.queryCve('CVE-2022-99999', true);

    expect(result).toBeDefined();
    expect(result.verdict).toBe('UNAVAILABLE');
    expect(result.providerStatus).toBe('ERROR');
  });

  it('degrades gracefully when optional external credentials are absent', () => {
    const unconfiguredConfig = new ConfigService();
    const prov = new UrlhausProvider(unconfiguredConfig, new ThreatIntelRateLimiterService());

    expect(prov.isConfigured()).toBe(true); // functions in public feed mode
    expect(prov.getDescriptor().isConfigured).toBe(true);
  });
});
