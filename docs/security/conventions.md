# Sentinel Security Conventions & Engineering Standards

> **Authoritative Baseline**: [SENTINEL_PROJECT_MASTER_DOCUMENTATION.md](../SENTINEL_PROJECT_MASTER_DOCUMENTATION.md)  
> **Security Baseline**: [security_baseline.md](security_baseline.md)  
> **Threat Model**: [threat_model.md](threat_model.md)  
> **OWASP Alignment**: [owasp_alignment.md](owasp_alignment.md)  
> **Deterministic Engine**: [engine.md](engine.md)

---

## 1. Secrets Management

- **Zero Plaintext Secrets:** Under no circumstances may API keys, JWT secrets, database credentials, or cryptographic keys be committed to version control.
- **Environment Configuration:** All sensitive parameters are injected through validated environment variables (`.env` for local development, strictly ignored by `.gitignore`).
- **Example Templates:** Every `.env` file must have a sanitized `.env.example` companion showing expected variable names with placeholder values.
- **Production Management:** Production credentials must be provided via secure secret vaults or container runtime secrets.

---

## 2. Exception Handling & Data Redaction

- **Global Sanitizer (`AllExceptionsFilter`):** In `apps/backend/src/common/filters/all-exceptions.filter.ts`, all unhandled application errors pass through an automated redaction pipeline.
- **Database & Stack Scrubbing:** Database connection strings, passwords, JWT tokens, and internal server stack traces are stripped before emitting sanitized generic error messages to clients.
- **Client-Safe Error Envelopes:** Errors conform to standard JSON response envelopes (`{ success: false, error: { code, message }, timestamp }`).

---

## 3. Network Boundaries & SSRF Defense

- **Target URL Validation:** External HTTP requests originating from the backend (such as Threat Intelligence lookups) must validate candidate hostnames against strict domain regexes.
- **Private IP Denylist:** Requests resolving to RFC 1918 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), link-local (`169.254.0.0/16`), or cloud metadata services are blocked before network socket allocation.

---

## 4. Authorization & Access Control (BOLA / IDOR)

- **Ownership Verification:** Every endpoint retrieving or mutating devices, scans, findings, or recommendations must verify that the requesting user owns the underlying entity.
- **Stateless Bearer Tokens:** Authentication uses HMAC-SHA256 JWT tokens with structured claims (`userId`, `email`, `role`).
- **Timing-Safe Credential Verification:** Password validation utilizes constant-time bcrypt comparison (12 salt rounds) with dummy evaluation on non-existent users to eliminate user enumeration timing vectors.

---

## 5. Telemetry & Data Provenance

- **Explicit Provenance Tags:** Every collected security signal must specify its provenance status:
  - `VERIFIED` — Directly verified through authenticated OS API.
  - `ANALYZED` — Evaluated through cross-signal correlation.
  - `USER_PROVIDED` — Declared by user input.
  - `NOT_AVAILABLE` — Feature not supported on platform.
  - `PERMISSION_REQUIRED` — Requires user permission grant.
  - `UNABLE_TO_VERIFY` — OS sandbox restricts access.
- **Honest Scoring:** The absence of telemetry must never be scored as a negative finding, nor may unverified signals be assumed secure. If verifiable telemetry is insufficient, the system emits `score: null`.

---

## 6. Secure Development Lifecycle

- **Automated Regression Testing:** Security hardening tests (`apps/backend/test/security/security-hardening.spec.ts`) run on every CI build.
- **Dependency Auditing:** Dependencies are pinned with `pnpm-lock.yaml` and regularly audited for known CVEs via `pnpm audit`.
- **Static Analysis:** TypeScript strict mode enabled across all workspaces (`noImplicitAny`, `strictNullChecks`).
