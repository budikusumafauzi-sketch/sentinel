# Sentinel — Security Baseline

**Status:** Phase 9 Hardened Baseline  
**Classification:** Internal Engineering Standard  
**Revision Date:** September 2026  
**Audience:** Core Engineers, Platform Maintainers, Security Reviewers

---

## 1. Executive Summary

Sentinel is a Personal Cybersecurity Intelligence platform that unifies host device telemetry, deterministic compliance and posture scoring, real-time threat intelligence feeds, and constrained generative AI analysis.

Phase 9 establishes an authoritative **Security Baseline** across the entire Sentinel product footprint:

- Backend (`apps/backend`): NestJS + Fastify REST API, Prisma ORM, PostgreSQL, Redis cache.
- Threat Intelligence (`@sentinel/backend` Threat Intel module): Multi-feed ingestion (CISA KEV, OSV.dev, URLhaus, OpenPhish), strict SSRF perimeter validation, and provider isolation.
- AI Intelligence (`@sentinel/backend` AI module): Constrained Gemini LLM integration with schema validation, prompt injection sandboxing, and immutable deterministic score invariance.
- Desktop Agent (`apps/desktop`): Lightweight Rust/Tauri telemetry collector with hardened localhost IPC boundary.
- Mobile App (`apps/mobile`): React Native / Expo application with secure credential handling and zero backend secret exposure.

---

## 2. Core Security Architecture & Trust Boundaries

Sentinel operates on the fundamental principle that **all client-supplied telemetry, AI model output, and external provider responses are untrusted**.

```
                                      TRUST BOUNDARIES
┌─────────────────┐       ┌─────────────────┐       ┌────────────────────────┐
│  Mobile App     │       │  Desktop Agent  │       │  External Threat Feeds │
│  (React Native) │       │  (Rust/Tauri)   │       │  (CISA, URLhaus, etc.) │
└────────┬────────┘       └────────┬────────┘       └───────────┬────────────┘
         │ (JWT / TLS)             │ (IPC 127.0.0.1:8765)       │ (Outbound HTTPS)
         ▼                         ▼                            ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    Sentinel Backend API (NestJS + Fastify)                 │
│                                                                            │
│  [Fastify 10MB Limit] ──► [Global Exception Filter & Secret Sanitizer]     │
│  [Throttler / Rate Limit] ──► [JWT Auth Guard] ──► [ParseUUID & DTO Valid] │
│  [Resource Ownership Guard (IDOR/BOLA Prevention)]                         │
└───────────────────────┬────────────────────────────┬───────────────────────┘
                        │                            │
                        ▼                            ▼
         ┌───────────────────────────┐    ┌──────────────────────────────┐
         │ Deterministic Engine      │    │ Sandboxed AI Analyzer        │
         │ (Authoritative Rules/Risk)│    │ (Advisory Only, Untrusted)   │
         └──────────────┬────────────┘    └──────────────┬───────────────┘
                        │                                │
                        ▼                                ▼
         ┌───────────────────────────────────────────────────────────────┐
         │       PostgreSQL Database (Prisma ORM, Parameterized)         │
         └───────────────────────────────────────────────────────────────┘
```

### Trust Boundary Matrix

| Boundary                        | Origin / Actor                           | Destination                                | Defense In Depth Controls                                                                                                           |
| :------------------------------ | :--------------------------------------- | :----------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **TB-1: Client to API**         | Mobile / Browser / CLI                   | Backend Fastify Gateway                    | TLS, JWT validation, 10MB payload cap, Fastify security headers, Class-Validator DTOs, global exception redaction                   |
| **TB-2: User to Resources**     | Authenticated User A                     | User B's Devices / Scans / Recommendations | Server-side ownership verification (`userId === scan.userId`), IDOR/BOLA rejection with 403 Forbidden                               |
| **TB-3: Backend to Network**    | Threat Intel & AI Service                | Outbound HTTP / Remote Hosts               | `ThreatIntelValidator` strict SSRF filters (IPv4 loopback, RFC 1918 private IPs, cloud metadata, IPv6 bracketed/unspecified/mapped) |
| **TB-4: External Feeds to API** | Public Threat Feeds (URLhaus, OSV, CISA) | Internal Threat Intel Service              | Circuit breakers, timeout caps (5s), rate limiters, fallback isolation, strict response parsing                                     |
| **TB-5: AI Model to System**    | Gemini 1.5 Flash API                     | Security Engine & Reporting                | Prompt injection isolation delimiters, JSON schema validation, provenance tagging, deterministic score invariance                   |
| **TB-6: Local Host to Desktop** | Local Web Browser / Malware              | Desktop Agent TCP IPC                      | Enforced `Host: 127.0.0.1:8765`, strict `Origin` matching (rejection of foreign browser origins, DNS rebinding prevention)          |
| **TB-7: Database Persistence**  | Backend Logic                            | PostgreSQL Storage                         | Prisma type-safe queries, zero raw concatenated SQL, connection string redaction in all exception paths                             |

---

## 3. Subsystem Security Specifications

### 3.1 Authentication & Password Handling

1. **Password Hashing**: Bcrypt with 12 salt rounds (`SALT_ROUNDS = 12`). Plaintext passwords are never persisted, logged, or serialized.
2. **Timing-Attack Resistance**: When an unauthenticated caller attempts to log in with a non-existent email, `AuthService` executes a dummy bcrypt comparison (`DUMMY_BCRYPT_HASH`) against a precomputed 12-round hash. This matches the CPU latency of valid credential verification, preventing user enumeration timing attacks.
3. **Identifier Normalization**: Email identifiers are stripped of leading/trailing whitespace and converted to lower case (`email.trim().toLowerCase()`) on both registration and authentication.
4. **DoS Mitigation**: Password fields enforce a strict `@MaxLength(128)` constraint on login and registration to prevent computational exhaustion DoS via oversized bcrypt hash workloads.
5. **Token Security**: Tokens are generated via HMAC-SHA256 signed JWTs with short expiry windows. Malformed, expired, or invalid signatures trigger immediate `401 Unauthorized`.

### 3.2 Authorization & Resource Ownership (IDOR / BOLA Prevention)

1. **Authoritative Ownership**: Client-supplied `userId`, `deviceId`, or claims are never trusted for authorization.
2. **Multi-Hop Traversal Verification**:
   - `ScansService`: Enforces `scan.userId === user.id`.
   - `FindingsService`: Traverses `finding.scan.userId === user.id`.
   - `RecommendationsService`: Verifies either finding chain (`finding.scan.userId === user.id`) or device chain (`device.userId === user.id`). Cross-user requests are denied with `403 Forbidden`.
   - `SecurityAdvisor` / AI explain: Verifies that the requested device or finding belongs to the caller before querying telemetry or invoking AI.

### 3.3 API Security & Input Validation

1. **Payload Limit**: Fastify adapter enforces `bodyLimit: 10485760` (10 MB) to prevent denial of service through large request payloads.
2. **Global Validation Pipe**: Configured with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true` to reject undeclared payload properties.
3. **Format Validation**:
   - CVE identifiers: Enforce regex `^CVE-\d{4}-\d{4,8}$` to eliminate path traversal or SQL injection vectors.
   - Domain names: Enforce strict RFC hostname character regex `^[a-zA-Z0-9.\-_:]+$`.
   - Device and Finding IDs: Enforce RFC 4122 UUID v4 formatting via `@IsUUID()` and `ParseUUIDPipe`.
   - Raw Evidence arrays: Bound to maximum 500 items via `@ArrayMaxSize(500)` in `SyncEvidenceDto`.

### 3.4 Outbound Network & SSRF Perimeter Controls

The `ThreatIntelValidator` executes multi-layer validation before any external HTTP request is performed:

1. **Loopback & Localhost Rejection**: `127.0.0.0/8`, `localhost`, `0.0.0.0`.
2. **Private Network Rejection (RFC 1918)**: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
3. **Link-Local & Cloud Metadata Rejection**: `169.254.0.0/16`, `169.254.169.254`, `metadata.google.internal`, `instance-data`.
4. **IPv6 Hardening**: Unspecified `::`, loopback `::1` (bracketed `[::1]`), IPv4-mapped IPv6 (`::ffff:127.0.0.1`, `[::ffff:...]`), unique local `fc00::/7`, link-local `fe80::/10`.
5. **Scheme Enforcement**: Only `http:` and `https:` schemes are permitted. Schemes such as `file:`, `ftp:`, `javascript:`, or `data:` are rejected with `BadRequestException`.
6. **URL Normalization**: Strips embedded credentials (`user:pass@`), fragments (`#hash`), and sensitive tracking parameters prior to query execution.

### 3.5 Rate Limiting & Abuse Resistance

1. **Throttling Policy**:
   - Authentication routes (`/auth/register`, `/auth/login`): 5 requests per 60 seconds.
   - AI Analysis routes (`/ai/*`): 15 requests per 60 seconds to protect inference quota and budget.
   - Threat Intelligence routes (`/threat-intel/*`): 30 requests per 60 seconds.
   - General API endpoints: 100 requests per 60 seconds.
2. **Graceful Fallback**: The Threat Intel cache service and rate limiter operate via Redis with transparent in-memory fallback. If Redis is unavailable, rate limiting and caching continue in process memory without failing open or exposing an infinite attack surface.

### 3.6 Error Handling & Information Disclosure

1. **Exception Filter**: Centralized `AllExceptionsFilter` intercepts all thrown errors.
2. **Production Masking**: Unhandled internal exceptions return generic messages:
   ```json
   {
     "success": false,
     "error": {
       "code": "INTERNAL_ERROR",
       "message": "Internal server error"
     },
     "path": "/api/v1/...",
     "timestamp": "2026-09-04T15:30:00.000Z"
   }
   ```
3. **Credential Redaction**: Outgoing error messages are scanned and sanitized via regular expressions to redact database connection strings (`postgresql://[REDACTED]`, `redis://[REDACTED]`), Bearer tokens, and JWT tokens.

### 3.7 AI Integration Security (Untrusted Component Model)

1. **Advisory Role**: AI analysis is strictly advisory (`aiInterpretationOnly: true`). AI responses **cannot** mutate or override the deterministic security score calculated by the Security Engine.
2. **Prompt Injection Defense**: User telemetry and external threat data are wrapped inside structural delimiter blocks with explicit instructions forbidding instruction override.
3. **Structured Schema Validation**: All model output is parsed through `OutputValidator`. Any attempt by the model to output score overrides, missing required schema attributes, or unknown keys results in rejection with fallback to deterministic reports.

### 3.8 Desktop Agent & Local IPC Security

1. **Loopback Binding**: The desktop agent listens exclusively on `127.0.0.1:8765`.
2. **Host Header Validation**: Every incoming HTTP request must specify `Host: 127.0.0.1:8765` or `Host: localhost:8765`. Requests specifying foreign or DNS-rebinding hostnames are rejected with `403 Forbidden`.
3. **Cross-Origin Browser Protection**: Requests specifying an `Origin` header (issued by web browsers during cross-origin fetch/XHR) or external `Referer` headers are rejected with `403 Forbidden`. This prevents malicious websites visited by the user from sending unauthorized scan commands to the desktop agent.
4. **Command Allowlist**: Process execution and telemetry collection invoke only hardcoded, allowlisted system commands (`wmic`, `powershell Get-CimInstance`, `netsh`). User input is never passed to command shell evaluators.

### 3.9 Mobile Application Security

1. **Secure Storage**: Authentication tokens are stored using platform-encrypted storage primitives (`expo-secure-store` on iOS Keychain and Android Keystore).
2. **Zero Backend Secret Exposure**: No database passwords, JWT signing secrets, Gemini API keys, or provider API tokens are bundled into the mobile client code or Expo configuration.
3. **TLS Communications**: All network operations communicate over HTTPS with backend authentication headers.

### 3.10 Supply Chain & CI/CD Security

1. **Dependency Pinning**: All dependencies in `package.json` and `Cargo.toml` are pinned with lockfiles (`pnpm-lock.yaml`, `Cargo.lock`).
2. **Vulnerability Overrides**: Root `pnpm-workspace.yaml` enforces overrides (`fastify >= 5.12.1`, `postcss >= 8.5.23`, `decode-uri-component >= 0.5.0`) to neutralize known upstream advisories.
3. **Least Privilege CI**: GitHub Actions workflow (`.github/workflows/ci.yml`) explicitly defines `permissions: { contents: read }`.

---

## 4. Security Regression Test Suite

The automated security regression test suite (`apps/backend/test/security/security-hardening.spec.ts`) verifies these controls on every build:

| Area        | Test Description                                                                 | Status |
| :---------- | :------------------------------------------------------------------------------- | :----- |
| **Auth**    | Constant-time dummy bcrypt verification on non-existent users                    | PASS   |
| **Auth**    | Email normalization (case insensitivity and whitespace trimming)                 | PASS   |
| **Auth**    | Password max length constraint (128 char limit against CPU exhaustion)           | PASS   |
| **Auth**    | Malformed email rejection on register/login                                      | PASS   |
| **Authz**   | IDOR: User B denied from viewing User A recommendation                           | PASS   |
| **Authz**   | Direct access: User A allowed to view own recommendation                         | PASS   |
| **Authz**   | BOLA: User B denied from linking recommendation to User A finding                | PASS   |
| **Input**   | CVE ID format validation and SQL injection / path traversal rejection            | PASS   |
| **Input**   | Domain format validation and protocol / URI rejection                            | PASS   |
| **Input**   | Sync evidence array size capping (rejection of >500 items)                       | PASS   |
| **Input**   | AI Advisor and Explain request UUID validation rejection of non-UUIDs            | PASS   |
| **SSRF**    | IPv4 loopback rejection (`127.0.0.0/8`, `localhost`)                             | PASS   |
| **SSRF**    | IPv4 private network rejection (RFC 1918: 10/8, 172.16/12, 192.168/16)           | PASS   |
| **SSRF**    | Cloud metadata rejection (`169.254.169.254`, `metadata.google.internal`)         | PASS   |
| **SSRF**    | IPv6 loopback, unspecified, and IPv4-mapped IPv6 rejection (`::1`, `::ffff:...`) | PASS   |
| **SSRF**    | Non-HTTP protocol rejection (`file://`, `ftp://`, `javascript:`)                 | PASS   |
| **SSRF**    | Valid public HTTPS target normalization and hostname extraction                  | PASS   |
| **Secrets** | Database connection string and Bearer token error sanitization                   | PASS   |
| **Errors**  | Internal stack trace masking with generic 500 in production                      | PASS   |
| **AI**      | Prompt injection score override stripping & deterministic score preservation     | PASS   |
| **AI**      | Malformed structured AI payload schema validation rejection                      | PASS   |

---

## 5. Residual Risks & Platform Limitations

While Phase 9 establishes high-assurance controls, the following residual risks and platform limitations are recognized for future architecture phases:

1. **DNS Rebinding & Time-Of-Check to Time-Of-Use (TOCTOU)**: `ThreatIntelValidator` verifies hostnames prior to HTTP dispatch. While IPv4/IPv6 address targets are strictly filtered, domain names resolved by the underlying HTTP client at connection time could technically rebind if an attacker controls an external nameserver with 0-TTL records. Full socket-level IP pinning will be evaluated in Phase 10.
2. **Local Machine Multi-User Desktop Isolation**: On Windows multi-user environments, any local process executing under the same user context has access to loopback TCP ports (`127.0.0.1:8765`). While browser cross-origin requests are blocked via `Host`/`Origin` inspection, malicious native software running in the same user session can interact with local IPC.
3. **Upstream Bundler Dev Vulnerabilities**: React Native / Metro bundling sub-dependencies (`image-size`, `deepmerge-ts` in Prisma CLI tooling) contain upstream advisories with no current standalone patch that does not break Metro build tooling. These tools run strictly during build time and are not bundled into production backend runtime execution.
