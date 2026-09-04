# Threat Intelligence Architecture (Phase 8)

## 1. Overview & Architectural Role

Sentinel incorporates an external **Threat Intelligence** layer to enrich device security analysis, vulnerability assessments, and threat explanations.

### Fundamental Guardrails

1. **Supplemental Intelligence**: Threat intelligence is strictly advisory and contextual.
2. **Deterministic Score Invariance**: Threat intelligence **never** mutates, overrides, or directly modifies Sentinel's deterministic security score or finding weights. The deterministic Security Engine remains authoritative.
3. **AI Grounding**: Gemini AI is enriched with structured threat intelligence but is strictly prevented from overriding, hallucinating, or downgrading verified threat intelligence verdicts.
4. **Resilience & Failure Isolation**: External network failures, rate limits, or timeouts never crash or degrade Sentinel core operations.

---

## 2. Provider Abstraction

The system utilizes a provider-agnostic abstraction located in `apps/backend/src/threat-intel/`:

```
                    ┌─────────────────────────┐
                    │   ThreatIntelService    │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CisaKevProvider│     │   OsvProvider   │     │ UrlhausProvider │
│  (CISA KEV Feed)│     │(Google OSV API) │     │ (abuse.ch Feed) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│OpenPhishProvider│     │ExposureProvider │
│(Community Feed) │     │  (Aggregator)   │
└─────────────────┘     └─────────────────┘
```

All providers implement the `ThreatIntelProvider` interface:

- `id`: Unique identifier string (e.g., `cisa_kev`, `osv`).
- `displayName`: Human-readable name.
- `supportedTypes`: Array of supported `ThreatIntelType` (`URL`, `DOMAIN`, `CVE`, `EXPOSURE`, `FILE_HASH`).
- `reliability`: Explicit `SourceReliability` metadata.
- `query(normalizedIndicator, type, options)`: Returns normalized `ThreatIntelResult`.
- `getDescriptor()`: Public metadata for provider enumeration.

---

## 3. Approved External Sources

Sentinel integrates legitimate, reputable, defensive cybersecurity sources that operate without mandatory paid subscriptions or required credentials:

| Provider               | ID          | Focus                                   | Auth Requirements                                     | Authority Level                | Rate Limits                     |
| :--------------------- | :---------- | :-------------------------------------- | :---------------------------------------------------- | :----------------------------- | :------------------------------ |
| **CISA KEV**           | `cisa_kev`  | Known Exploited Vulnerabilities Catalog | **None** (Public official JSON feed)                  | `AUTHORITATIVE_GOVERNMENT`     | Cached 24h; bounded fetch       |
| **OSV.dev**            | `osv`       | Open Source Vulnerabilities / CVSS      | **None** (Google OSV public REST API)                 | `REPUTABLE_SECURITY_COMMUNITY` | Bounded retries (10 req/s safe) |
| **URLhaus**            | `urlhaus`   | Malware distribution URLs & domains     | **None** (abuse.ch public CSV feed; optional API key) | `REPUTABLE_SECURITY_COMMUNITY` | Cached 1h; 30s cooldown on 429  |
| **OpenPhish**          | `openphish` | Active zero-day phishing feeds          | **None** (Public community feed)                      | `REPUTABLE_SECURITY_COMMUNITY` | Cached 1h                       |
| **Defensive Exposure** | `exposure`  | Known weaponized exposure aggregator    | **Internal** (Synthesized from CISA KEV & URLhaus)    | `AUTHORITATIVE_GOVERNMENT`     | Inherits underlying feeds       |

### Credential Handling & Graceful Degradation

- All providers function out of the box with zero external credentials.
- Optional configuration (`THREAT_INTEL_URLHAUS_API_KEY`) is read from environment variables if present.
- If optional credentials are absent or invalid, the provider automatically falls back to public community feeds.

---

## 4. Normalized Intelligence Contract

All external responses are mapped into the shared normalized contract (`@sentinel/types`):

```typescript
export interface ThreatIntelResult {
  intelligenceType: ThreatIntelType; // 'URL' | 'DOMAIN' | 'CVE' | 'EXPOSURE' | 'FILE_HASH'
  indicator: string; // Queried indicator
  normalizedIndicator: string; // Sanitized/canonicalized indicator
  verdict: ThreatVerdict; // 'CLEAN' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN' | 'UNAVAILABLE'
  threatType: ThreatCategory; // 'MALWARE' | 'PHISHING' | 'VULNERABILITY' | 'EXPLOIT' | 'DATA_EXPOSURE' | 'NONE' | 'UNKNOWN'
  confidence: number; // 0.0 to 1.0
  severity: ThreatSeverity; // 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'UNKNOWN'
  source: string; // Provider ID
  sourceDisplayName: string; // Human readable provider name
  sourceReliability: SourceReliability; // Tier, Authority, Confidence Score
  providerStatus: ProviderStatus; // 'SUCCESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'TIMEOUT' | 'ERROR'
  summary: string; // Concise summary
  details?: string; // Detailed findings
  evidence: Record<string, any>; // Structured evidence
  references: ThreatReference[]; // External advisory URLs
  retrievedAt: string; // ISO timestamp
  cached: boolean; // Cache status
}
```

---

## 5. Source Reliability & Provenance

Every source has an explicit, non-arbitrary reliability tier:

- `AUTHORITATIVE_GOVERNMENT`: Government certs (CISA, NVD). Base reliability: 0.98.
- `REPUTABLE_SECURITY_COMMUNITY`: Established security initiatives (OSV.dev, abuse.ch, OpenPhish). Base reliability: 0.88.
- `COMMERCIAL_THREAT_INTEL`: Commercial intelligence feeds. Base reliability: 0.85.
- `OPEN_SOURCE_FEED`: Uncurated public blocklists. Base reliability: 0.70.

---

## 6. Caching Architecture

Caching prevents redundant external requests and honors source freshness requirements:

1. **Redis Cache**: Primary cache store using key prefix `threat_intel:{type}:{sha256(indicator)}`.
2. **In-Memory LRU Cache Fallback**: When Redis is unavailable, an in-memory TTL map takes over seamlessly.
3. **Deterministic Keys**: Indicator hashes are computed via SHA-256 after normalization. No raw user data, passwords, or query tokens enter cache keys.
4. **Configurable TTLs**:
   - CVEs / Advisories: 24 hours (86,400s)
   - URLs / Domains: 1 hour (3,600s)
   - Expirations: Enforced deterministically on fetch.

---

## 7. Rate Limiting & Bounded Retries

The `ThreatIntelRateLimiterService` provides provider-aware rate limiting:

- **429 Detection**: Automatically places the offending provider into a temporary cooldown window (default 30 seconds).
- **Short-circuiting**: Requests during a cooldown return `UNAVAILABLE` with status `RATE_LIMITED` immediately without issuing network calls.
- **Bounded Backoff**: Max 1 retry for transient 5xx server errors with exponential backoff (e.g., 500ms, 1000ms).
- **Zero Infinite Loops**: Strict limits guarantee bounded latency under all failure modes.

---

## 8. Failure Isolation & Bounded Timeouts

- Network requests use `AbortController` timeouts (default 5,000ms for APIs; 8,000ms for feeds).
- Network errors, DNS resolution failures, or malformed JSON return normalized `UNAVAILABLE` or `UNKNOWN` results.
- External outages never crash or block the backend service.

---

## 9. SSRF Protection & Input Sanitization

To prevent Server-Side Request Forgery (SSRF) and malicious probing, the `SsrfValidator` enforces:

- Rejection of IPv4 loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and link-local (`169.254.0.0/16`).
- Rejection of IPv6 loopback (`::1`), link-local (`fe80::/10`), and unique local (`fc00::/7`).
- Rejection of reserved domain suffixes (`.local`, `.internal`, `.lan`, `.corp`, `.home`).
- Requirement for dot-separated public domain names.
- Automatic stripping of user credentials, basic auth, and sensitive query tokens (e.g., `token`, `key`, `secret`).
- Enforcement of `http` or `https` protocols only.

---

## 10. Privacy & Data Minimization

- **Minimal Data**: Only the specific normalized indicator (domain, sanitized URL path, or CVE ID) is queried.
- **No Device Info**: Device names, IP addresses, OS patches, user IDs, or local filesystem information are never transmitted to external threat intelligence providers.
- **Safe Logging**: Structured logs omit credentials, bearer tokens, cookies, or sensitive query strings.

---

## 11. Defensive Scope Boundaries (Strictly No Offensive Functions)

Per project guidelines and ethical standards:

- **Allowed**: Known exploited vulnerability checks (CISA KEV), CVSS metric retrieval (OSV.dev), phishing / malware URL blocklist checking (URLhaus, OpenPhish).
- **Strictly Prohibited & Not Implemented**: Credential harvesting, credential stuffing, password guessing, unauthorized account enumeration, scraping private information, dark-web scraping, intrusive port scanning, or offensive exploitation.

---

## 12. Adding a New Provider

To add a new intelligence provider:

1. Create an adapter class implementing `ThreatIntelProvider` in `apps/backend/src/threat-intel/providers/`.
2. Define the provider's `reliability` metadata and supported `ThreatIntelType`.
3. Implement `query(...)` mapping the external format to `ThreatIntelResult`.
4. Wrap outbound HTTP calls using `ThreatIntelRateLimiterService.executeWithRetry(...)`.
5. Register the provider in `ThreatIntelModule` providers list.
6. Register the provider in `ThreatIntelService` constructor registry.
7. Add automated unit and mock tests in `apps/backend/test/threat-intel/`.
