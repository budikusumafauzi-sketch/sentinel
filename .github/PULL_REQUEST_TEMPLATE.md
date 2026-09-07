## Description

<!-- Briefly describe the purpose of this change and what problem it addresses. -->

## Type of Change

- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 🛡️ Security hardening / vulnerability remediation
- [ ] 📚 Documentation update or correction
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] 🧪 Testing enhancement or regression suite addition

## Affected Components

- [ ] `@sentinel/backend` (NestJS / Fastify API)
- [ ] `@sentinel/mobile` (React Native / Expo App)
- [ ] `@sentinel/desktop` (Rust Windows Agent)
- [ ] `@sentinel/types` (Shared contracts & Security Engine)
- [ ] Infrastructure / CI / Docker / Config

## Architectural Invariants Verification

- [ ] **Deterministic Supremacy:** The 0–100 security score calculation is purely rule-based and NOT modified or overridden by any AI/LLM.
- [ ] **Honest Provenance:** New or modified telemetry signals carry explicit provenance tags (`VERIFIED`, `ANALYZED`, etc.).
- [ ] **Data Safety:** No secrets, credentials, internal connection strings, or unhashed sensitive data are added.
- [ ] **SSRF & Network Defenses:** External HTTP requests comply with SSRF restrictions and the IP denylist.
- [ ] **Access Control:** User authorization and ownership (BOLA/IDOR) are verified on all updated resources.

## Testing & Verification

- [ ] `pnpm test` passes cleanly with 100% test pass rate.
- [ ] `pnpm lint` passes with 0 errors.
- [ ] `pnpm format:check` passes with no style issues.
- [ ] Manual or emulator verification performed (attach screenshots or terminal logs below if UI/CLI changed).

## Screenshots / Terminal Output (if applicable)

<!-- Add relevant verification images or logs here -->
