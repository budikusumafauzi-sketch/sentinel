import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ThreatIntelResult, ThreatIntelType, ThreatProviderDescriptor } from '@sentinel/types';
import type { ThreatIntelProvider } from './interfaces/threat-intel-provider.interface';
import { ThreatIntelCacheService } from './cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from './rate-limiting/threat-intel-rate-limiter.service';
import { ThreatIntelValidator } from './validation/ssrf-validator';
import { CisaKevProvider } from './providers/cisa-kev.provider';
import { OsvProvider } from './providers/osv.provider';
import { UrlhausProvider } from './providers/urlhaus.provider';
import { OpenPhishProvider } from './providers/openphish.provider';
import { ExposureProvider } from './providers/exposure.provider';

@Injectable()
export class ThreatIntelService {
  private readonly logger = new Logger(ThreatIntelService.name);
  private readonly providers = new Map<string, ThreatIntelProvider>();
  private readonly requestTimeoutMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: ThreatIntelCacheService,
    private readonly rateLimiter: ThreatIntelRateLimiterService,
    private readonly cisaKevProvider: CisaKevProvider,
    private readonly osvProvider: OsvProvider,
    private readonly urlhausProvider: UrlhausProvider,
    private readonly openPhishProvider: OpenPhishProvider,
    private readonly exposureProvider: ExposureProvider,
  ) {
    this.requestTimeoutMs = this.configService.get<number>('THREAT_INTEL_REQUEST_TIMEOUT_MS', 5000);

    // Register all approved providers
    this.registerProvider(this.cisaKevProvider);
    this.registerProvider(this.osvProvider);
    this.registerProvider(this.urlhausProvider);
    this.registerProvider(this.openPhishProvider);
    this.registerProvider(this.exposureProvider);

    this.logger.log(
      `Threat Intelligence Service initialized with ${this.providers.size} approved providers`,
    );
  }

  /**
   * Registers a Threat Intelligence provider into the registry.
   */
  registerProvider(provider: ThreatIntelProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Returns descriptors of all registered providers.
   */
  getProviders(): ThreatProviderDescriptor[] {
    return Array.from(this.providers.values()).map((p) => p.getDescriptor());
  }

  /**
   * Resolves a provider by ID.
   */
  getProvider(id: string): ThreatIntelProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Resolves all providers supporting a specific intelligence type.
   */
  getProvidersForType(type: ThreatIntelType): ThreatIntelProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.supportedTypes.includes(type));
  }

  /**
   * Unified threat intelligence query entrypoint.
   * Dispatches to normalized typed workflows.
   */
  async queryIndicator(
    type: ThreatIntelType,
    rawIndicator: string,
    forceRefresh = false,
  ): Promise<ThreatIntelResult> {
    switch (type) {
      case 'URL':
        return this.queryUrl(rawIndicator, forceRefresh);
      case 'DOMAIN':
        return this.queryDomain(rawIndicator, forceRefresh);
      case 'CVE':
        return this.queryCve(rawIndicator, forceRefresh);
      case 'EXPOSURE':
        return this.queryExposure(rawIndicator, 'CVE', forceRefresh);
      default:
        throw new BadRequestException(`Unsupported intelligence type: ${type}`);
    }
  }

  /**
   * Evaluates external threat intelligence for a URL.
   * Performs SSRF protection, sanitization, and multi-source correlation (OpenPhish + URLhaus).
   */
  async queryUrl(rawUrl: string, forceRefresh = false): Promise<ThreatIntelResult> {
    const startTime = Date.now();
    const normalized = ThreatIntelValidator.normalizeUrl(rawUrl);

    // 1. Cache lookup
    if (!forceRefresh) {
      const cached = await this.cacheService.get('URL', normalized.normalizedUrl);
      if (cached) {
        this.logOperation(
          'queryUrl',
          'URL',
          normalized.hostname,
          cached.verdict,
          true,
          Date.now() - startTime,
        );
        return cached;
      }
    }

    // 2. Query URL intelligence providers in parallel (OpenPhish + URLhaus)
    const [openPhishRes, urlhausRes] = await Promise.allSettled([
      this.openPhishProvider.query(normalized.normalizedUrl, 'URL', {
        originalIndicator: rawUrl,
        timeoutMs: this.requestTimeoutMs,
      }),
      this.urlhausProvider.query(normalized.normalizedUrl, 'URL', {
        originalIndicator: rawUrl,
        timeoutMs: this.requestTimeoutMs,
      }),
    ]);

    const res1 = openPhishRes.status === 'fulfilled' ? openPhishRes.value : null;
    const res2 = urlhausRes.status === 'fulfilled' ? urlhausRes.value : null;

    // 3. Correlate results
    let finalResult: ThreatIntelResult;

    if (res1?.verdict === 'MALICIOUS') {
      finalResult = res1;
      if (res2?.verdict === 'MALICIOUS') {
        // Merge evidence and references from both providers
        finalResult.references = [...res1.references, ...res2.references];
        finalResult.evidence = {
          ...res1.evidence,
          ...res2.evidence,
          verifiedByMultipleSources: true,
        };
      }
    } else if (res2?.verdict === 'MALICIOUS') {
      finalResult = res2;
    } else if (res1 && res1.verdict !== 'UNAVAILABLE') {
      finalResult = res1;
      if (res2 && res2.verdict !== 'UNAVAILABLE') {
        finalResult.references = [...res1.references, ...res2.references];
      }
    } else if (res2 && res2.verdict !== 'UNAVAILABLE') {
      finalResult = res2;
    } else {
      // Both unavailable
      finalResult = {
        intelligenceType: 'URL',
        indicator: rawUrl,
        normalizedIndicator: normalized.normalizedUrl,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'url_intelligence_aggregator',
        sourceDisplayName: 'Sentinel URL Intelligence Aggregator',
        sourceReliability: {
          authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
          reliabilityScore: 0.9,
          isAuthoritative: false,
          description: 'Multi-source URL intelligence aggregator.',
        },
        providerStatus: 'ERROR',
        summary: 'External URL threat intelligence feeds are temporarily unreachable',
        details:
          'OpenPhish and URLhaus feeds failed to respond. Core security scanning remains functional.',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    }

    // 4. Cache result
    await this.cacheService.set('URL', normalized.normalizedUrl, finalResult);

    this.logOperation(
      'queryUrl',
      'URL',
      normalized.hostname,
      finalResult.verdict,
      false,
      Date.now() - startTime,
    );
    return finalResult;
  }

  /**
   * Evaluates external threat intelligence for a domain.
   */
  async queryDomain(rawDomain: string, forceRefresh = false): Promise<ThreatIntelResult> {
    const startTime = Date.now();
    const normalized = ThreatIntelValidator.normalizeDomain(rawDomain);

    // 1. Cache lookup
    if (!forceRefresh) {
      const cached = await this.cacheService.get('DOMAIN', normalized.normalizedDomain);
      if (cached) {
        this.logOperation(
          'queryDomain',
          'DOMAIN',
          normalized.normalizedDomain,
          cached.verdict,
          true,
          Date.now() - startTime,
        );
        return cached;
      }
    }

    // 2. Query domain intelligence providers (URLhaus + OpenPhish)
    const [urlhausRes, openPhishRes] = await Promise.allSettled([
      this.urlhausProvider.query(normalized.normalizedDomain, 'DOMAIN', {
        originalIndicator: rawDomain,
        timeoutMs: this.requestTimeoutMs,
      }),
      this.openPhishProvider.query(normalized.normalizedDomain, 'DOMAIN', {
        originalIndicator: rawDomain,
        timeoutMs: this.requestTimeoutMs,
      }),
    ]);

    const res1 = urlhausRes.status === 'fulfilled' ? urlhausRes.value : null;
    const res2 = openPhishRes.status === 'fulfilled' ? openPhishRes.value : null;

    let finalResult: ThreatIntelResult;

    if (res1?.verdict === 'MALICIOUS') {
      finalResult = res1;
      if (res2?.verdict === 'MALICIOUS') {
        finalResult.references = [...res1.references, ...res2.references];
        finalResult.evidence = {
          ...res1.evidence,
          ...res2.evidence,
          verifiedByMultipleSources: true,
        };
      }
    } else if (res2?.verdict === 'MALICIOUS') {
      finalResult = res2;
    } else if (res1 && res1.verdict !== 'UNAVAILABLE') {
      finalResult = res1;
    } else if (res2 && res2.verdict !== 'UNAVAILABLE') {
      finalResult = res2;
    } else {
      finalResult = {
        intelligenceType: 'DOMAIN',
        indicator: rawDomain,
        normalizedIndicator: normalized.normalizedDomain,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'domain_intelligence_aggregator',
        sourceDisplayName: 'Sentinel Domain Intelligence Aggregator',
        sourceReliability: {
          authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
          reliabilityScore: 0.9,
          isAuthoritative: false,
          description: 'Multi-source domain intelligence aggregator.',
        },
        providerStatus: 'ERROR',
        summary: 'External domain intelligence feeds are currently unreachable',
        evidence: {},
        references: [],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    }

    await this.cacheService.set('DOMAIN', normalized.normalizedDomain, finalResult);
    this.logOperation(
      'queryDomain',
      'DOMAIN',
      normalized.normalizedDomain,
      finalResult.verdict,
      false,
      Date.now() - startTime,
    );
    return finalResult;
  }

  /**
   * Evaluates external vulnerability and security advisory intelligence for a CVE.
   * Combines authoritative CISA KEV (actively exploited status) with OSV.dev (advisories & CVSS).
   */
  async queryCve(rawCve: string, forceRefresh = false): Promise<ThreatIntelResult> {
    const startTime = Date.now();
    const normalized = ThreatIntelValidator.normalizeCve(rawCve);

    // 1. Cache lookup
    if (!forceRefresh) {
      const cached = await this.cacheService.get('CVE', normalized.normalizedCve);
      if (cached) {
        this.logOperation(
          'queryCve',
          'CVE',
          normalized.normalizedCve,
          cached.verdict,
          true,
          Date.now() - startTime,
        );
        return cached;
      }
    }

    // 2. Query CISA KEV and OSV.dev in parallel
    const [cisaRes, osvRes] = await Promise.allSettled([
      this.cisaKevProvider.query(normalized.normalizedCve, 'CVE', {
        originalIndicator: rawCve,
        timeoutMs: this.requestTimeoutMs,
      }),
      this.osvProvider.query(normalized.normalizedCve, 'CVE', {
        originalIndicator: rawCve,
        timeoutMs: this.requestTimeoutMs,
      }),
    ]);

    const cisa = cisaRes.status === 'fulfilled' ? cisaRes.value : null;
    const osv = osvRes.status === 'fulfilled' ? osvRes.value : null;

    let finalResult: ThreatIntelResult;

    if (cisa && cisa.verdict === 'MALICIOUS') {
      // Actively exploited in CISA KEV — highest authority!
      finalResult = { ...cisa };
      if (osv && osv.verdict === 'MALICIOUS') {
        // Enrich with OSV advisory details, affected packages, and CVSS
        finalResult.references = [...cisa.references, ...osv.references];
        finalResult.evidence = {
          ...cisa.evidence,
          osvDetails: osv.details,
          affectedPackages: osv.evidence.affectedPackages,
          cvssScore: osv.evidence.cvssScore,
        };
      }
    } else if (osv && osv.verdict === 'MALICIOUS') {
      // Listed in OSV advisories, not in CISA KEV
      finalResult = { ...osv };
      finalResult.evidence.inCisaKev = false;
      if (cisa) {
        finalResult.references = [...osv.references, ...cisa.references];
      }
    } else if (cisa && cisa.verdict !== 'UNAVAILABLE') {
      finalResult = cisa;
    } else if (osv && osv.verdict !== 'UNAVAILABLE') {
      finalResult = osv;
    } else {
      finalResult = {
        intelligenceType: 'CVE',
        indicator: rawCve,
        normalizedIndicator: normalized.normalizedCve,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: 'cve_intelligence_aggregator',
        sourceDisplayName: 'Sentinel CVE Advisory Aggregator',
        sourceReliability: {
          authorityLevel: 'AUTHORITATIVE_GOVERNMENT',
          reliabilityScore: 0.98,
          isAuthoritative: true,
          description: 'Authoritative vulnerability intelligence aggregator.',
        },
        providerStatus: 'ERROR',
        summary: `Vulnerability intelligence feeds temporarily unreachable for ${normalized.normalizedCve}`,
        evidence: {},
        references: [
          {
            name: 'NVD Lookup',
            url: `https://nvd.nist.gov/vuln/detail/${normalized.normalizedCve}`,
            type: 'CVE',
          },
        ],
        retrievedAt: new Date().toISOString(),
        cached: false,
      };
    }

    await this.cacheService.set('CVE', normalized.normalizedCve, finalResult);
    this.logOperation(
      'queryCve',
      'CVE',
      normalized.normalizedCve,
      finalResult.verdict,
      false,
      Date.now() - startTime,
    );
    return finalResult;
  }

  /**
   * Evaluates defensive exposure intelligence for an indicator (CVE, Domain, or Software).
   */
  async queryExposure(
    indicator: string,
    indicatorType: 'DOMAIN' | 'CVE' | 'SOFTWARE' = 'CVE',
    forceRefresh = false,
  ): Promise<ThreatIntelResult> {
    const startTime = Date.now();
    let sanitizedIndicator = indicator.trim();

    if (indicatorType === 'CVE' || /^CVE-\d{4}-\d{4,8}$/i.test(sanitizedIndicator)) {
      sanitizedIndicator = ThreatIntelValidator.normalizeCve(sanitizedIndicator).normalizedCve;
    } else if (indicatorType === 'DOMAIN') {
      sanitizedIndicator =
        ThreatIntelValidator.normalizeDomain(sanitizedIndicator).normalizedDomain;
    }

    if (!forceRefresh) {
      const cached = await this.cacheService.get('EXPOSURE', sanitizedIndicator);
      if (cached) {
        this.logOperation(
          'queryExposure',
          'EXPOSURE',
          sanitizedIndicator,
          cached.verdict,
          true,
          Date.now() - startTime,
        );
        return cached;
      }
    }

    const result = await this.exposureProvider.query(sanitizedIndicator, 'EXPOSURE', {
      originalIndicator: indicator,
      timeoutMs: this.requestTimeoutMs,
    });

    await this.cacheService.set('EXPOSURE', sanitizedIndicator, result);
    this.logOperation(
      'queryExposure',
      'EXPOSURE',
      sanitizedIndicator,
      result.verdict,
      false,
      Date.now() - startTime,
    );
    return result;
  }

  /**
   * Safe structured logging adhering strictly to privacy requirements:
   * ZERO secrets, passwords, cookies, or sensitive query params logged.
   */
  private logOperation(
    op: string,
    type: ThreatIntelType,
    indicator: string,
    verdict: string,
    cached: boolean,
    latencyMs: number,
  ): void {
    // Truncate indicator for logs to avoid leaking excessively long data
    const safeIndicator = indicator.length > 64 ? indicator.slice(0, 61) + '...' : indicator;
    this.logger.log(
      JSON.stringify({
        context: 'ThreatIntelService',
        operation: op,
        intelligenceType: type,
        indicator: safeIndicator,
        verdict,
        cached,
        latencyMs,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
