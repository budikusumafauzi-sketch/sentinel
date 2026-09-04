import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ThreatIntelResult,
  ThreatIntelType,
  ThreatSeverity,
  SourceReliability,
  ThreatProviderDescriptor,
  ThreatReference,
} from '@sentinel/types';
import type {
  ThreatIntelProvider,
  ProviderQueryOptions,
} from '../interfaces/threat-intel-provider.interface';
import { ThreatIntelRateLimiterService } from '../rate-limiting/threat-intel-rate-limiter.service';

interface OsvSeverity {
  type: string;
  score: string;
}

interface OsvReference {
  type: string;
  url: string;
}

interface OsvVulnerability {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  modified?: string;
  published?: string;
  severity?: OsvSeverity[];
  affected?: Array<{
    package?: { name: string; ecosystem?: string };
    ranges?: Array<{ type: string; events: Array<Record<string, string>> }>;
    versions?: string[];
  }>;
  references?: OsvReference[];
}

@Injectable()
export class OsvProvider implements ThreatIntelProvider {
  readonly id = 'osv';
  readonly name = 'osv';
  readonly displayName = 'Open Source Vulnerabilities (OSV / Google)';
  readonly supportedTypes: ThreatIntelType[] = ['CVE'];
  readonly attribution = 'Open Source Vulnerabilities (OSV) Database / OpenSSF';
  readonly termsUrl = 'https://osv.dev';

  readonly reliability: SourceReliability = {
    authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
    reliabilityScore: 0.95,
    isAuthoritative: false,
    description:
      'Open-source distributed vulnerability database maintained by Google and the Open Source Security Foundation.',
  };

  private readonly logger = new Logger(OsvProvider.name);
  private readonly baseUrl = 'https://api.osv.dev/v1/vulns';

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: ThreatIntelRateLimiterService,
  ) {}

  isConfigured(): boolean {
    return true; // Free, public REST API
  }

  getDescriptor(): ThreatProviderDescriptor {
    return {
      id: this.id,
      name: this.displayName,
      supportedTypes: this.supportedTypes,
      reliability: this.reliability,
      isConfigured: this.isConfigured(),
      isHealthy: true,
      attribution: this.attribution,
      termsUrl: this.termsUrl,
    };
  }

  async query(
    normalizedIndicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult> {
    const cveId = normalizedIndicator.toUpperCase();
    const retrievedAt = new Date().toISOString();
    const timeoutMs = options?.timeoutMs || 5000;

    return this.rateLimiter.executeWithRetry(
      this.id,
      async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(`${this.baseUrl}/${encodeURIComponent(cveId)}`, {
            method: 'GET',
            headers: {
              'User-Agent': 'Sentinel-Security-Intelligence/1.0',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          if (response.status === 404) {
            return {
              intelligenceType: type,
              indicator: options?.originalIndicator || cveId,
              normalizedIndicator: cveId,
              verdict: 'UNKNOWN',
              threatType: 'NONE',
              confidence: 0.7,
              severity: 'UNKNOWN',
              source: this.id,
              sourceDisplayName: this.displayName,
              sourceReliability: this.reliability,
              providerStatus: 'NOT_FOUND',
              summary: `No advisory record found for ${cveId} in OSV database.`,
              evidence: {},
              references: [
                {
                  name: 'NVD Search',
                  url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
                  type: 'CVE',
                },
              ],
              retrievedAt,
              cached: false,
            };
          }

          if (response.status === 429) {
            const err = new Error('OSV API rate limit encountered');
            (err as any).status = 429;
            throw err;
          }

          if (!response.ok) {
            const err = new Error(`OSV API returned HTTP ${response.status}`);
            (err as any).status = response.status;
            throw err;
          }

          const vuln = (await response.json()) as OsvVulnerability;
          const { severity, cvssScore } = this.parseSeverity(vuln.severity);
          const references: ThreatReference[] = (vuln.references || []).map((ref) => ({
            name: ref.type ? `${ref.type} Reference` : 'External Advisory',
            url: ref.url,
            type: ref.type === 'ADVISORY' ? 'ADVISORY' : 'ARTICLE',
          }));

          // Ensure NVD reference is included
          references.unshift({
            name: `NVD Detail (${cveId})`,
            url: `https://nvd.nist.gov/vuln/detail/${cveId}`,
            type: 'CVE',
          });

          const affectedPackages = (vuln.affected || [])
            .map((a) => a.package?.name)
            .filter(Boolean);

          return {
            intelligenceType: type,
            indicator: options?.originalIndicator || cveId,
            normalizedIndicator: cveId,
            verdict: 'MALICIOUS',
            threatType: 'EXPLOITED_VULNERABILITY',
            confidence: 0.95,
            severity,
            source: this.id,
            sourceDisplayName: this.displayName,
            sourceReliability: this.reliability,
            providerStatus: 'SUCCESS',
            summary: vuln.summary || `Vulnerability advisory published for ${cveId}`,
            details: vuln.details,
            evidence: {
              osvId: vuln.id,
              aliases: vuln.aliases || [],
              affectedPackages,
              cvssScore,
              rawSeverity: vuln.severity,
              modified: vuln.modified,
            },
            references,
            publishedAt: vuln.published,
            retrievedAt,
            cached: false,
          };
        } catch (err: any) {
          const isTimeout = err.name === 'AbortError' || /timeout/i.test(err.message);
          const isRateLimit = err.status === 429 || /rate.?limit/i.test(err.message);

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
            providerStatus: isRateLimit ? 'RATE_LIMITED' : isTimeout ? 'TIMEOUT' : 'ERROR',
            summary: `OSV intelligence temporarily unavailable for ${cveId}`,
            details: isTimeout ? 'Request timed out' : err.message,
            evidence: {},
            references: [],
            retrievedAt,
            cached: false,
          };
        } finally {
          clearTimeout(timer);
        }
      },
      { maxRetries: 1, initialDelayMs: 400 },
    );
  }

  private parseSeverity(severities?: OsvSeverity[]): {
    severity: ThreatSeverity;
    cvssScore?: string;
  } {
    if (!severities || severities.length === 0) {
      return { severity: 'HIGH' }; // Default security advisory severity
    }

    const cvss = severities.find((s) => s.type?.startsWith('CVSS'));
    if (!cvss) {
      return { severity: 'HIGH' };
    }

    const vector = cvss.score;
    // Inspect CVSS vector for base score or severity
    if (vector.includes('/S:C') || vector.includes('/C:H/I:H/A:H')) {
      return { severity: 'CRITICAL', cvssScore: vector };
    }
    if (vector.includes('/C:H') || vector.includes('/I:H') || vector.includes('/A:H')) {
      return { severity: 'HIGH', cvssScore: vector };
    }
    if (vector.includes('/C:L') || vector.includes('/I:L') || vector.includes('/A:L')) {
      return { severity: 'MEDIUM', cvssScore: vector };
    }

    return { severity: 'MEDIUM', cvssScore: vector };
  }
}
