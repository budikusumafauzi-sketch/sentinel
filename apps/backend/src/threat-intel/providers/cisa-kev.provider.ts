import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ThreatIntelResult,
  ThreatIntelType,
  SourceReliability,
  ThreatProviderDescriptor,
} from '@sentinel/types';
import type {
  ThreatIntelProvider,
  ProviderQueryOptions,
} from '../interfaces/threat-intel-provider.interface';
import { ThreatIntelRateLimiterService } from '../rate-limiting/threat-intel-rate-limiter.service';

interface CisaKevVulnerability {
  cveID: string;
  vendorProject: string;
  product: string;
  vulnerabilityName: string;
  dateAdded: string;
  shortDescription: string;
  requiredAction: string;
  dueDate: string;
  knownRansomwareCampaignUse: string;
  notes: string;
  cwes?: string[];
}

interface CisaKevCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: CisaKevVulnerability[];
}

@Injectable()
export class CisaKevProvider implements ThreatIntelProvider {
  readonly id = 'cisa_kev';
  readonly name = 'cisa_kev';
  readonly displayName = 'CISA Known Exploited Vulnerabilities (KEV)';
  readonly supportedTypes: ThreatIntelType[] = ['CVE', 'EXPOSURE'];
  readonly attribution =
    'Cybersecurity and Infrastructure Security Agency (CISA) Known Exploited Vulnerabilities Catalog';
  readonly termsUrl = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';

  readonly reliability: SourceReliability = {
    authorityLevel: 'AUTHORITATIVE_GOVERNMENT',
    reliabilityScore: 0.98,
    isAuthoritative: true,
    description:
      'Official US Government cybersecurity intelligence authoritative feed of vulnerabilities actively exploited in the wild.',
  };

  private readonly logger = new Logger(CisaKevProvider.name);
  private readonly feedUrl =
    'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
  private catalogCache: Map<string, CisaKevVulnerability> = new Map();
  private catalogVersion = 'unknown';
  private lastFetchedMs = 0;
  private readonly refreshIntervalMs = 86400000; // 24 hours

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: ThreatIntelRateLimiterService,
  ) {}

  isConfigured(): boolean {
    // CISA KEV is public and requires zero API keys
    return true;
  }

  getDescriptor(): ThreatProviderDescriptor {
    return {
      id: this.id,
      name: this.displayName,
      supportedTypes: this.supportedTypes,
      reliability: this.reliability,
      isConfigured: this.isConfigured(),
      isHealthy:
        this.catalogCache.size > 0 || Date.now() - this.lastFetchedMs < this.refreshIntervalMs,
      attribution: this.attribution,
      termsUrl: this.termsUrl,
    };
  }

  async checkHealth(): Promise<{ isHealthy: boolean; message?: string }> {
    try {
      await this.ensureCatalogLoaded();
      return {
        isHealthy: true,
        message: `Catalog loaded with ${this.catalogCache.size} active exploited CVEs (version ${this.catalogVersion})`,
      };
    } catch (err: any) {
      return { isHealthy: false, message: err.message };
    }
  }

  async query(
    normalizedIndicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult> {
    const cveId = normalizedIndicator.toUpperCase();
    const retrievedAt = new Date().toISOString();

    try {
      await this.ensureCatalogLoaded(options?.timeoutMs);
    } catch (err: any) {
      this.logger.warn(`Failed to load CISA KEV feed: ${err.message}`);
      // Failure isolation: return normalized unavailable result
      return {
        intelligenceType: type,
        indicator: options?.originalIndicator || cveId,
        normalizedIndicator: cveId,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: err.status === 429 ? 'RATE_LIMITED' : 'ERROR',
        summary: 'CISA KEV catalog is currently unavailable',
        details:
          'External network or timeout communicating with CISA feed. Core security scanning remains functional.',
        evidence: {},
        references: [{ name: 'CISA KEV Catalog', url: this.termsUrl, type: 'ADVISORY' }],
        retrievedAt,
        cached: false,
      };
    }

    const match = this.catalogCache.get(cveId);

    if (match) {
      const isRansomware =
        match.knownRansomwareCampaignUse &&
        match.knownRansomwareCampaignUse.toLowerCase() !== 'unknown';
      const notesList = match.notes
        ? match.notes
            .split(';')
            .map((n) => n.trim())
            .filter((n) => n.startsWith('http'))
        : [];

      const references = [
        {
          name: `CISA Advisory (${match.cveID})`,
          url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=${match.cveID}`,
          type: 'ADVISORY' as const,
        },
        {
          name: 'NVD Vulnerability Detail',
          url: `https://nvd.nist.gov/vuln/detail/${match.cveID}`,
          type: 'CVE' as const,
        },
        ...notesList.map((url, i) => ({
          name: `Vendor Advisory ${i + 1}`,
          url,
          type: 'ADVISORY' as const,
        })),
      ];

      return {
        intelligenceType: type,
        indicator: options?.originalIndicator || cveId,
        normalizedIndicator: cveId,
        verdict: 'MALICIOUS',
        threatType: isRansomware ? 'RANSOMWARE' : 'EXPLOITED_VULNERABILITY',
        confidence: 1.0, // Authoritative verified exploitation
        severity: 'CRITICAL',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: 'SUCCESS',
        summary: `Actively exploited in the wild: ${match.vulnerabilityName} (${match.cveID})`,
        details: match.shortDescription,
        evidence: {
          vendorProject: match.vendorProject,
          product: match.product,
          vulnerabilityName: match.vulnerabilityName,
          dateAdded: match.dateAdded,
          requiredAction: match.requiredAction,
          dueDate: match.dueDate,
          knownRansomwareCampaignUse: match.knownRansomwareCampaignUse,
          cwes: match.cwes || [],
          catalogVersion: this.catalogVersion,
        },
        references,
        publishedAt: match.dateAdded,
        retrievedAt,
        cached: false,
      };
    }

    // Not in CISA KEV catalog (not currently verified as actively exploited in KEV)
    return {
      intelligenceType: type,
      indicator: options?.originalIndicator || cveId,
      normalizedIndicator: cveId,
      verdict: 'UNKNOWN',
      threatType: 'NONE',
      confidence: 0.85,
      severity: 'INFO',
      source: this.id,
      sourceDisplayName: this.displayName,
      sourceReliability: this.reliability,
      providerStatus: 'NOT_FOUND',
      summary: `${cveId} is not listed in the CISA Known Exploited Vulnerabilities catalog.`,
      details:
        'This indicates no confirmed widespread active exploitation tracked by CISA at this time. Check general CVE advisory intelligence for general vulnerability severity.',
      evidence: {
        inCisaKev: false,
        catalogVersion: this.catalogVersion,
      },
      references: [
        {
          name: 'CISA KEV Search',
          url: `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=${cveId}`,
          type: 'ADVISORY',
        },
        { name: 'NVD Lookup', url: `https://nvd.nist.gov/vuln/detail/${cveId}`, type: 'CVE' },
      ],
      retrievedAt,
      cached: false,
    };
  }

  /**
   * Loads or refreshes the CISA KEV JSON catalog.
   */
  private async ensureCatalogLoaded(timeoutMs = 8000): Promise<void> {
    const now = Date.now();
    if (this.lastFetchedMs > 0 && now - this.lastFetchedMs < this.refreshIntervalMs) {
      return;
    }

    await this.rateLimiter.executeWithRetry(
      this.id,
      async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(this.feedUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Sentinel-Security-Intelligence/1.0',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          if (!response.ok) {
            const err = new Error(`CISA KEV feed returned HTTP ${response.status}`);
            (err as any).status = response.status;
            throw err;
          }

          const data = (await response.json()) as CisaKevCatalog;
          if (!data || !Array.isArray(data.vulnerabilities)) {
            throw new Error('Malformed CISA KEV feed structure received');
          }

          const newMap = new Map<string, CisaKevVulnerability>();
          for (const vuln of data.vulnerabilities) {
            if (vuln.cveID) {
              newMap.set(vuln.cveID.toUpperCase(), vuln);
            }
          }

          this.catalogCache = newMap;
          this.catalogVersion = data.catalogVersion || 'latest';
          this.lastFetchedMs = Date.now();

          this.logger.log(
            `CISA KEV catalog synchronized: ${newMap.size} exploited vulnerabilities loaded (version ${this.catalogVersion})`,
          );
        } finally {
          clearTimeout(timer);
        }
      },
      { maxRetries: 1, initialDelayMs: 500 },
    );
  }

  /**
   * Test helper to inject mock data into catalog cache.
   */
  seedMockCatalog(vulnerabilities: CisaKevVulnerability[]): void {
    const map = new Map<string, CisaKevVulnerability>();
    for (const v of vulnerabilities) {
      map.set(v.cveID.toUpperCase(), v);
    }
    this.catalogCache = map;
    this.lastFetchedMs = Date.now();
    this.catalogVersion = 'mock-v1';
  }
}
