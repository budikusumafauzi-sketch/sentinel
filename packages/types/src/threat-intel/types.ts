/**
 * Sentinel Phase 8: Threat Intelligence Shared Contracts.
 *
 * Provider-agnostic normalized threat intelligence interfaces.
 *
 * CRITICAL ARCHITECTURAL PRINCIPLES:
 * 1. Supplemental Intelligence: Threat intelligence informs findings and recommendations,
 *    but NEVER replaces the deterministic security engine.
 * 2. Score Invariance: External providers CANNOT directly modify or arbitrarily mutate
 *    the deterministic security score.
 * 3. Provenance & Attribution: Every intelligence result explicitly tracks source,
 *    reliability metadata, retrieval timestamp, and cache state.
 */

export type ThreatIntelType = 'URL' | 'DOMAIN' | 'CVE' | 'EXPOSURE';

export type ThreatVerdict = 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN' | 'UNKNOWN' | 'UNAVAILABLE';

export type ThreatCategory =
  | 'PHISHING'
  | 'MALWARE'
  | 'EXPLOITED_VULNERABILITY'
  | 'SUSPICIOUS_REPUTATION'
  | 'KNOWN_ABUSE'
  | 'RANSOMWARE'
  | 'DATA_EXPOSURE'
  | 'NONE'
  | 'UNKNOWN';

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'UNKNOWN';

export type ProviderStatus =
  'SUCCESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'TIMEOUT' | 'ERROR' | 'UNCONFIGURED';

export type AuthorityLevel =
  | 'AUTHORITATIVE_GOVERNMENT'
  | 'REPUTABLE_SECURITY_COMMUNITY'
  | 'COMMERCIAL_FEED'
  | 'LOCAL_HEURISTIC';

/**
 * Explicit deterministic representation of source reliability.
 * Prevents arbitrary provider outputs from masquerading as authoritative truth.
 */
export interface SourceReliability {
  authorityLevel: AuthorityLevel;
  /** Reliability weight from 0.0 (unverified) to 1.0 (authoritative standard) */
  reliabilityScore: number;
  /** True only for official standard authorities like CISA KEV or NVD */
  isAuthoritative: boolean;
  description: string;
}

export interface ThreatReference {
  name: string;
  url: string;
  type?: 'ADVISORY' | 'CVE' | 'ARTICLE' | 'REMEDIATION' | 'EVIDENCE' | 'COMMUNITY';
}

/**
 * Normalized Threat Intelligence Contract (PRD Phase 8).
 * Completely provider-neutral result envelope.
 */
export interface ThreatIntelResult {
  intelligenceType: ThreatIntelType;
  /** The raw queried indicator provided by caller */
  indicator: string;
  /** The canonical sanitized/normalized indicator searched */
  normalizedIndicator: string;
  /** High-level security verdict */
  verdict: ThreatVerdict;
  /** Specific threat classification */
  threatType: ThreatCategory;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Severity rating */
  severity: ThreatSeverity;
  /** Unique identifier of the intelligence source (e.g., 'cisa_kev', 'osv', 'urlhaus') */
  source: string;
  /** Human-readable display name of the provider */
  sourceDisplayName: string;
  /** Deterministic reliability metadata */
  sourceReliability: SourceReliability;
  /** Execution status of the provider query */
  providerStatus: ProviderStatus;
  /** Concise human-readable summary of intelligence */
  summary: string;
  /** Optional detailed explanation */
  details?: string;
  /** Structured provider-specific evidence fields (e.g. CVSS vector, CWE, ransomware tags) */
  evidence: Record<string, unknown>;
  /** Traceable external references and advisories */
  references: ThreatReference[];
  /** When the indicator was first observed in the wild if known */
  firstSeen?: string;
  /** When the indicator was last updated or verified by the source */
  lastSeen?: string;
  /** Original publication date (e.g. CVE publication or advisory release) */
  publishedAt?: string;
  /** ISO timestamp when Sentinel retrieved this intelligence */
  retrievedAt: string;
  /** Cache expiration timestamp if applicable */
  expiresAt?: string;
  /** Indicates whether this result came from Sentinel's cache */
  cached: boolean;
  /** Non-sensitive metadata (e.g. response latency, catalog version) */
  metadata?: Record<string, unknown>;
}

// ──────────────────────────────────────────
// Request Contracts
// ──────────────────────────────────────────

export interface QueryThreatIntelInput {
  type: ThreatIntelType;
  indicator: string;
  forceRefresh?: boolean;
}

export interface QueryUrlThreatInput {
  url: string;
  forceRefresh?: boolean;
}

export interface QueryDomainThreatInput {
  domain: string;
  forceRefresh?: boolean;
}

export interface QueryCveThreatInput {
  cveId: string;
  forceRefresh?: boolean;
}

export interface QueryExposureThreatInput {
  indicator: string;
  indicatorType: 'DOMAIN' | 'CVE' | 'SOFTWARE';
  forceRefresh?: boolean;
}

// ──────────────────────────────────────────
// Provider Descriptor
// ──────────────────────────────────────────

export interface ThreatProviderDescriptor {
  id: string;
  name: string;
  supportedTypes: ThreatIntelType[];
  reliability: SourceReliability;
  isConfigured: boolean;
  isHealthy: boolean;
  attribution: string;
  termsUrl?: string;
}
