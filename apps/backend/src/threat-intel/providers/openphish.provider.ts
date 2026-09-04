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
export class OpenPhishProvider implements ThreatIntelProvider {
  readonly id = 'openphish';
  readonly name = 'openphish';
  readonly displayName = 'OpenPhish Community Feed';
  readonly supportedTypes: ThreatIntelType[] = ['URL', 'DOMAIN'];
  readonly attribution = 'OpenPhish targeted phishing threat intelligence feed';
  readonly termsUrl = 'https://openphish.com';

  readonly reliability: SourceReliability = {
    authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
    reliabilityScore: 0.9,
    isAuthoritative: false,
    description:
      'Autonomous phishing intelligence platform aggregating and verifying active phishing campaigns in real time.',
  };

  private readonly logger = new Logger(OpenPhishProvider.name);
  private readonly feedUrl = 'https://openphish.com/feed.txt';

  private activePhishUrls = new Set<string>();
  private activePhishHosts = new Set<string>();
  private lastFetchedMs = 0;
  private readonly refreshIntervalMs = 3600000; // 1 hour

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: ThreatIntelRateLimiterService,
  ) {}

  isConfigured(): boolean {
    return true; // Free community feed, no API key required
  }

  getDescriptor(): ThreatProviderDescriptor {
    return {
      id: this.id,
      name: this.displayName,
      supportedTypes: this.supportedTypes,
      reliability: this.reliability,
      isConfigured: this.isConfigured(),
      isHealthy:
        this.activePhishUrls.size > 0 || Date.now() - this.lastFetchedMs < this.refreshIntervalMs,
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

    try {
      await this.ensureFeedLoaded(options?.timeoutMs);
    } catch (err: any) {
      this.logger.warn(`Failed to synchronize OpenPhish feed: ${err.message}`);
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
        summary: 'OpenPhish threat feed temporarily unavailable',
        details: 'External network timeout or connection error to OpenPhish feed.',
        evidence: {},
        references: [{ name: 'OpenPhish Project', url: this.termsUrl, type: 'COMMUNITY' }],
        retrievedAt,
        cached: false,
      };
    }

    let matched = false;
    let matchType = 'none';

    if (type === 'URL') {
      if (this.activePhishUrls.has(indicator)) {
        matched = true;
        matchType = 'exact_url';
      } else {
        try {
          const parsed = new URL(indicator.startsWith('http') ? indicator : `https://${indicator}`);
          if (this.activePhishHosts.has(parsed.hostname.toLowerCase())) {
            matched = true;
            matchType = 'phishing_host';
          }
        } catch {
          // ignore
        }
      }
    } else if (type === 'DOMAIN') {
      if (this.activePhishHosts.has(indicator)) {
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
        threatType: 'PHISHING',
        confidence: 0.95,
        severity: 'CRITICAL',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: 'SUCCESS',
        summary: `Identified as an active verified phishing site by OpenPhish (${matchType}).`,
        details:
          'Target of an active credential theft, impersonation, or social engineering campaign.',
        evidence: {
          matchType,
          feed: 'OpenPhish community active feed',
          verifiedPhishing: true,
        },
        references: [{ name: 'OpenPhish Details', url: this.termsUrl, type: 'COMMUNITY' }],
        retrievedAt,
        cached: false,
      };
    }

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
      summary: 'Not observed in OpenPhish active phishing feed.',
      details: 'No verified active phishing URLs matched in current feed.',
      evidence: { matched: false },
      references: [{ name: 'OpenPhish Project', url: this.termsUrl, type: 'COMMUNITY' }],
      retrievedAt,
      cached: false,
    };
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
            redirect: 'follow',
            headers: { 'User-Agent': 'Sentinel-Security-Intelligence/1.0' },
            signal: controller.signal,
          });

          if (!res.ok) {
            const err = new Error(`OpenPhish feed returned HTTP ${res.status}`);
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
              // ignore
            }
          }

          this.activePhishUrls = urlSet;
          this.activePhishHosts = hostSet;
          this.lastFetchedMs = Date.now();

          this.logger.log(
            `OpenPhish feed synchronized: ${urlSet.size} active phishing URLs loaded.`,
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
    this.activePhishUrls = new Set(urls.map((u) => u.toLowerCase()));
    this.activePhishHosts = new Set(hosts.map((h) => h.toLowerCase()));
    this.lastFetchedMs = Date.now();
  }
}
