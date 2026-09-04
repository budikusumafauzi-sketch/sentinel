import type {
  ThreatIntelType,
  ThreatIntelResult,
  SourceReliability,
  ThreatProviderDescriptor,
} from '@sentinel/types';

export interface ProviderQueryOptions {
  timeoutMs?: number;
  originalIndicator?: string;
  forceRefresh?: boolean;
}

/**
 * Provider-agnostic interface for external Threat Intelligence adapters.
 *
 * Requirements:
 * - Providers must be completely modular and replaceable without altering business logic.
 * - Providers must NEVER throw uncaught exceptions; errors are normalized to ThreatIntelResult
 *   with appropriate providerStatus ('ERROR' | 'TIMEOUT' | 'RATE_LIMITED').
 * - Providers must adhere to timeouts.
 * - Providers must preserve source attribution and references.
 */
export interface ThreatIntelProvider {
  /** Machine identifier (e.g. 'cisa_kev', 'osv', 'urlhaus', 'openphish') */
  readonly id: string;

  /** Canonical name */
  readonly name: string;

  /** Human-readable display name for UI */
  readonly displayName: string;

  /** Types of intelligence supported by this provider */
  readonly supportedTypes: ThreatIntelType[];

  /** Deterministic reliability metadata */
  readonly reliability: SourceReliability;

  /** Attribution statement required by license or fair use */
  readonly attribution: string;

  /** Public documentation or terms URL */
  readonly termsUrl?: string;

  /** Whether the provider has required configuration/credentials available */
  isConfigured(): boolean;

  /** Query intelligence for a normalized indicator */
  query(
    normalizedIndicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult>;

  /** Optional health probe */
  checkHealth?(): Promise<{ isHealthy: boolean; message?: string }>;

  /** Get provider descriptor for API reflection */
  getDescriptor(): ThreatProviderDescriptor;
}
