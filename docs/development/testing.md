# Sentinel Testing Guide

Sentinel enforces strict automated test verification across backend APIs, mobile components, deterministic security scoring, and native desktop inspection routines.

---

## Test Frameworks & Tooling

- **Backend (`apps/backend`):** Jest 29, `ts-jest`, Supertest
- **Mobile (`apps/mobile`):** Jest 29, `jest-expo`, React Native Testing Library
- **Desktop Agent (`apps/desktop`):** Native Rust `cargo test` harness
- **Security Engine (`packages/types`):** Pure TypeScript Jest suites

---

## Executing Tests

### Run All Workspace Suites

```bash
pnpm test
```

### Targeted Suite Execution

```bash
# Run backend tests only (16 suites, 130 tests)
pnpm --filter @sentinel/backend test

# Run backend security hardening regression suite
pnpm --filter @sentinel/backend test test/security/security-hardening.spec.ts

# Run AI service integration & boundary tests
pnpm --filter @sentinel/backend test test/ai/ai.service.spec.ts

# Run Threat Intelligence provider & SSRF tests
pnpm --filter @sentinel/backend test test/threat-intel/

# Run mobile component & UX remediation tests (10 suites, 48 tests)
pnpm --filter @sentinel/mobile test

# Run Windows Desktop Agent Rust tests (6 tests)
cargo test --manifest-path apps/desktop/Cargo.toml
```

---

## Test Suite Inventory & Coverage

### 1. Backend (`apps/backend/test/`)

| Suite                                   | Focus & Scenarios                                                                                                        |
| :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `security/security-hardening.spec.ts`   | BOLA/IDOR authorization guards, timing-safe bcrypt, SSRF IP denylist, Fastify payload limits, and exception sanitization |
| `ai/ai.service.spec.ts`                 | Constrained Gemini advisory, error handling, rate-limit backoff, and strict output validation                            |
| `ai/gemini.integration.spec.ts`         | Multimodal screenshot, suspicious SMS, and URL inspection workflows                                                      |
| `threat-intel/cve-intel.spec.ts`        | CISA KEV and OSV.dev lookup logic, CVSS normalization, and exposure mapping                                              |
| `threat-intel/cache-ratelimit.spec.ts`  | Redis provider caching, TTL expiration, and rate-limit cooldown handling                                                 |
| `threat-intel/score-invariance.spec.ts` | Proves that threat intelligence results never alter deterministic device scores                                          |
| `scans-evidence.spec.ts`                | Telemetry ingestion, provenance tagging, and scan lifecycle transitions                                                  |
| `health.controller.spec.ts`             | Service availability and database/Redis ping checks                                                                      |

### 2. Mobile (`apps/mobile/test/`)

| Suite                              | Focus & Scenarios                                                                                                             |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `phase-10-2-remediation.spec.tsx`  | Verifies resolution of layout overlaps, Evidence Card 7-layer hierarchy, screenshot image dropzone, and device mock cleansing |
| `components/ScoreGauge.test.tsx`   | Score gauge rendering, semantic status pills, and text wrapping without layout collision                                      |
| `components/EvidenceCard.test.tsx` | Provenance badges (`VERIFIED`, `NOT_AVAILABLE`, etc.) and plain-English translation                                           |
| `services/scanner.test.ts`         | Mock device telemetry collector and scan state management                                                                     |

### 3. Desktop Agent (`apps/desktop/src/`)

| Test File              | Focus & Scenarios                                                          |
| :--------------------- | :------------------------------------------------------------------------- |
| `src/models.rs`        | Serde serialization of telemetry models matching `@sentinel/types` schemas |
| `src/identity.rs`      | Local machine GUID generation and persistent `%APPDATA%` identity storage  |
| `src/inspection/os.rs` | Windows version, build number, and architecture parsing                    |

---

## Testing Conventions & Invariants

1. **Deterministic Scoring Invariance:**  
   Every new rule or scoring modification must include a test asserting that identical inputs produce identical scores, and that missing telemetry is never penalized.
2. **AI Boundary Invariance:**  
   Tests must assert that AI failures (timeouts, rate limits, or bad formats) fail closed and never corrupt device scan records or security ratings.
3. **No Network Side-Effects in Unit Tests:**  
   External providers (Gemini API, CISA KEV, URLhaus) must be mocked using test fixtures or Nock/Jest mocks during automated test runs.
4. **Clean Pass Standard:**  
   All tests must pass with 0 unhandled rejections or silent errors before any PR is merged.
