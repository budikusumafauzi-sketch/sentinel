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

@Injectable()
export class UrlhausProvider implements ThreatIntelProvider {
  readonly id = 'urlhaus';
  readonly name = 'urlhaus';
  readonly displayName = 'abuse.ch URLhaus';
  readonly supportedTypes: ThreatIntelType[] = ['URL', 'DOMAIN'];
  readonly attribution = 'abuse.ch URLhaus malware intelligence project';
  readonly termsUrl = 'https://urlhaus.abuse.ch';

  readonly reliability: SourceReliability = {
    authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
    reliabilityScore: 0.92,
    isAuthoritative: false,
    description:
      'Community-driven cybersecurity intelligence project by abuse.ch tracking active malware distribution endpoints.',
  };

  private readonly logger = new Logger(UrlhausProvider.name);
  private readonly feedUrl = 'https://urlhaus.abuse.ch/downloads/text_recent/';
  private readonly apiUrl = 'https://urlhaus-api.abuse.ch/v1';
  private readonly apiKey?: string;

  // In-memory cache of recent malicious URLs/hosts
  private knownMaliciousUrls = new Set<string>();
  private knownMaliciousHosts = new Set<string>();
  private lastFetchedMs = 0;
  private readonly refreshIntervalMs = 3600000; // 1 hour

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: ThreatIntelRateLimiterService,
  ) {
    this.apiKey = this.configService.get<string>('THREAT_INTEL_URLHAUS_API_KEY') || undefined;
  }

  isConfigured(): boolean {
    // URLhaus operates via public feed without key; supports optional Auth-Key for direct API
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
        this.knownMaliciousUrls.size > 0 ||
        Date.now() - this.lastFetchedMs < this.refreshIntervalMs,
      attribution: this.attribution,
      termsUrl: this.termsUrl,
    };
  }

  async query(
    normalizedIndicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult> {
    const indicator = normalizedIndicator.trim().toLowerCase();
    const retrievedAt = new Date().toISOString();

    // If optional API key is configured, use direct API lookup for highest precision
    if (this.apiKey) {
      return this.queryDirectApi(indicator, type, options);
    }

    // Otherwise use verified public feed with safe failure isolation
    try {
      await this.ensureFeedLoaded(options?.timeoutMs);
    } catch (err: any) {
      this.logger.warn(`Failed to synchronize URLhaus feed: ${err.message}`);
      return {
        intelligenceType: type,
        indicator: options?.originalIndicator || normalizedIndicator,
        normalizedIndicator,
        verdict: 'UNAVAILABLE',
        threatType: 'UNKNOWN',
        confidence: 0,
        severity: 'UNKNOWN',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: err.status === 429 ? 'RATE_LIMITED' : 'ERROR',
        summary: 'URLhaus threat feed temporarily unavailable',
        details: 'External network timeout or connection error to abuse.ch feed.',
        evidence: {},
        references: [{ name: 'URLhaus Project', url: this.termsUrl, type: 'COMMUNITY' }],
        retrievedAt,
        cached: false,
      };
    }

    // Match against known malicious endpoints
    let matched = false;
    let matchType = 'none';

    if (type === 'URL') {
      if (this.knownMaliciousUrls.has(indicator)) {
        matched = true;
        matchType = 'exact_url';
      } else {
        // Check if host part matches
        try {
          const parsed = new URL(indicator.startsWith('http') ? indicator : `https://${indicator}`);
          if (this.knownMaliciousHosts.has(parsed.hostname.toLowerCase())) {
            matched = true;
            matchType = 'malicious_host';
          }
        } catch {
          // safe parse ignore
        }
      }
    } else if (type === 'DOMAIN') {
      if (this.knownMaliciousHosts.has(indicator)) {
        matched = true;
        matchType = 'exact_domain';
      }
    }

    if (matched) {
      return {
        intelligenceType: type,
        indicator: options?.originalIndicator || normalizedIndicator,
        normalizedIndicator,
        verdict: 'MALICIOUS',
        threatType: 'MALWARE',
        confidence: 0.95,
        severity: 'CRITICAL',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: 'SUCCESS',
        summary: `Actively flagged by abuse.ch URLhaus as a malware distribution endpoint (${matchType}).`,
        details: 'The indicator appears in the abuse.ch verified malware intelligence database.',
        evidence: {
          matchType,
          database: 'abuse.ch URLhaus recent feeds',
          verifiedMalicious: true,
        },
        references: [
          {
            name: 'URLhaus Malware Search',
            url: `https://urlhaus.abuse.ch/browse.php?search=${encodeURIComponent(indicator)}`,
            type: 'COMMUNITY',
          },
        ],
        retrievedAt,
        cached: false,
      };
    }

    // Clean / Not found in recent malware distribution feed
    return {
      intelligenceType: type,
      indicator: options?.originalIndicator || normalizedIndicator,
      normalizedIndicator,
      verdict: 'UNKNOWN',
      threatType: 'NONE',
      confidence: 0.8,
      severity: 'INFO',
      source: this.id,
      sourceDisplayName: this.displayName,
      sourceReliability: this.reliability,
      providerStatus: 'NOT_FOUND',
      summary: `Not observed in abuse.ch recent malware distribution feed.`,
      details:
        'No active malware payloads or command-and-control distribution endpoints currently matched.',
      evidence: {
        checkedFeed: 'URLhaus recent text feed',
        matched: false,
      },
      references: [{ name: 'URLhaus Database', url: this.termsUrl, type: 'COMMUNITY' }],
      retrievedAt,
      cached: false,
    };
  }

  private async queryDirectApi(
    indicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult> {
    const retrievedAt = new Date().toISOString();
    const endpoint = type === 'URL' ? `${this.apiUrl}/url/` : `${this.apiUrl}/host/`;
    const formParam =
      type === 'URL'
        ? `url=${encodeURIComponent(indicator)}`
        : `host=${encodeURIComponent(indicator)}`;

    return this.rateLimiter.executeWithRetry(
      this.id,
      async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options?.timeoutMs || 5000);

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Auth-Key': this.apiKey!,
              'User-Agent': 'Sentinel-Security-Intelligence/1.0',
            },
            body: formParam,
            signal: controller.signal,
          });

          if (res.status === 429) {
            const err = new Error('URLhaus rate limit');
            (err as any).status = 429;
            throw err;
          }

          if (!res.ok) {
            const err = new Error(`URLhaus API returned HTTP ${res.status}`);
            (err as any).status = res.status;
            throw err;
          }

          const data = (await res.json()) as any;
          const queryStatus = data.query_status;

          if (queryStatus === 'ok') {
            const isOnline = data.url_status === 'online' || data.host_status === 'online';
            return {
              intelligenceType: type,
              indicator: options?.originalIndicator || indicator,
              normalizedIndicator: indicator,
              verdict: 'MALICIOUS',
              threatType: 'MALWARE',
              confidence: 0.98,
              severity: 'CRITICAL',
              source: this.id,
              sourceDisplayName: this.displayName,
              sourceReliability: this.reliability,
              providerStatus: 'SUCCESS',
              summary: `Confirmed malicious malware distribution site by URLhaus (${data.threat || 'malware'}).`,
              details: `URLhaus status: ${data.url_status || 'flagged'}. Tags: ${(data.tags || []).join(', ')}`,
              evidence: {
                id: data.id,
                threat: data.threat,
                tags: data.tags || [],
                urlStatus: data.url_status,
                reporter: data.reporter,
                isOnline,
              },
              references: [
                {
                  name: 'URLhaus Detail',
                  url: data.urlhaus_reference || this.termsUrl,
                  type: 'COMMUNITY',
                },
              ],
              firstSeen: data.date_added,
              retrievedAt,
              cached: false,
            };
          }

          return {
            intelligenceType: type,
            indicator: options?.originalIndicator || indicator,
            normalizedIndicator: indicator,
            verdict: 'UNKNOWN',
            threatType: 'NONE',
            confidence: 0.85,
            severity: 'INFO',
            source: this.id,
            sourceDisplayName: this.displayName,
            sourceReliability: this.reliability,
            providerStatus: 'NOT_FOUND',
            summary: `Not found in URLhaus malicious database.`,
            evidence: { queryStatus },
            references: [{ name: 'URLhaus Database', url: this.termsUrl, type: 'COMMUNITY' }],
            retrievedAt,
            cached: false,
          };
        } finally {
          clearTimeout(timer);
        }
      },
      { maxRetries: 1, initialDelayMs: 500 },
    );
  }

  private async ensureFeedLoaded(timeoutMs = 8000): Promise<void> {
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
          const res = await fetch(this.feedUrl, {
            headers: { 'User-Agent': 'Sentinel-Security-Intelligence/1.0' },
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = new Error(`URLhaus feed returned HTTP ${res.status}`);
            (err as any).status = res.status;
            throw err;
          }

          const text = await res.text();
          const lines = text.split('\n');
          const urlSet = new Set<string>();
          const hostSet = new Set<string>();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            urlSet.add(trimmed.toLowerCase());

            try {
              const u = new URL(trimmed);
              if (u.hostname) {
                hostSet.add(u.hostname.toLowerCase());
              }
            } catch {
              // ignore unparseable lines
            }
          }

          this.knownMaliciousUrls = urlSet;
          this.knownMaliciousHosts = hostSet;
          this.lastFetchedMs = Date.now();

          this.logger.log(
            `URLhaus feed updated: ${urlSet.size} malicious endpoints, ${hostSet.size} malicious hosts.`,
          );
        } finally {
          clearTimeout(timer);
        }
      },
      { maxRetries: 1, initialDelayMs: 500 },
    );
  }

  /** Test helper */
  seedMockData(urls: string[], hosts: string[] = []): void {
    this.knownMaliciousUrls = new Set(urls.map((u) => u.toLowerCase()));
    this.knownMaliciousHosts = new Set(hosts.map((h) => h.toLowerCase()));
    this.lastFetchedMs = Date.now();
  }
}
