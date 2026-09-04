# Sentinel — OWASP Security Alignment Review

> **Version**: 1.0.0 (Phase 9 Security Baseline)  
> **Status**: Verified Engineering Review  
> **Note**: This document reflects an engineering review against OWASP industry frameworks for hardening verification. It does not claim third-party formal compliance certification.

---

## 1. OWASP API Security Top 10 (2023)

| OWASP Risk     | Category                                        | Sentinel Status | Architectural Implementation & Verification                                                                                                                                                                                                                  |
| -------------- | ----------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **API1:2023**  | Broken Object Level Authorization (BOLA / IDOR) | **IMPLEMENTED** | All resources (devices, scans, findings, scores, recommendations) enforce tenant ownership (`userId`). Lookups verify owner ID against JWT sub claim. Cross-user requests return 403 Forbidden. Tested in `idor-bola.spec.ts`.                               |
| **API2:2023**  | Broken Authentication                           | **IMPLEMENTED** | Passwords hashed with bcrypt (12 rounds). Timing-resistant dummy comparison on invalid users. JWT validated with signature verification and expiration check. Strict `@MaxLength(128)` on password prevents CPU DoS.                                         |
| **API3:2023**  | Broken Object Property Level Authorization      | **IMPLEMENTED** | DTOs validate incoming properties with `class-validator` whitelist (`whitelist: true`, `forbidNonWhitelisted: true`). Sensitive fields (`userId`, `score`, `riskScore`) cannot be client-supplied.                                                           |
| **API4:2023**  | Unrestricted Resource Consumption               | **IMPLEMENTED** | Throttling configured globally and on sensitive endpoints (Auth: 10/min, AI: 15/min, Threat Intel: 30/min). Fastify body limit set to 10MB; arrays bounded (`@ArrayMaxSize(500)`). Bounded in-memory caches.                                                 |
| **API5:2023**  | Broken Function Level Authorization             | **IMPLEMENTED** | Role/User checks on all sensitive endpoints via `JwtAuthGuard` and `CurrentUser` decorator. Device ownership required for scan creation and evidence synchronization.                                                                                        |
| **API6:2023**  | Unrestricted Access to Sensitive Business Flows | **IMPLEMENTED** | Rate limiting applied to AI inference, Threat Intel external queries, and user registration/login.                                                                                                                                                           |
| **API7:2023**  | Server Side Request Forgery (SSRF)              | **IMPLEMENTED** | `ThreatIntelValidator` enforces comprehensive SSRF barriers against IPv4 loopback, private RFC 1918 ranges, link-local, IPv6 loopback, IPv4-mapped IPv6, and internal TLDs (`.internal`, `.local`, `.lan`). Applied across Threat Intel and AI URL analysis. |
| **API8:2023**  | Security Misconfiguration                       | **IMPLEMENTED** | Fastify helmet enabled for security headers; CORS restricted in production; global exception filter suppresses stack traces and internals; Swagger disabled/restricted in production.                                                                        |
| **API9:2023**  | Improper Inventory Management                   | **IMPLEMENTED** | Strict URI versioning (`/api/v1/`). Deprecated endpoints removed. OpenAPI/Swagger schema actively maintained.                                                                                                                                                |
| **API10:2023** | Unsafe Consumption of APIs                      | **IMPLEMENTED** | Upstream threat provider responses strictly validated; malformed provider data safely isolated; provider timeouts set to 5000ms; AI responses strictly validated via `OutputValidator` before downstream use.                                                |

---

## 2. OWASP Mobile Application Security Verification Standard (MASVS)

| MASVS Domain       | Focus Area                    | Sentinel Status | Implementation Notes                                                                                                                                                                      |
| ------------------ | ----------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MASVS-STORAGE**  | Secure Local Data Storage     | **IMPLEMENTED** | Access tokens maintained in-memory in React Native / Expo state. Sensitive credentials, passwords, and external provider API keys are never stored on device storage.                     |
| **MASVS-CRYPTO**   | Cryptography & Token Security | **IMPLEMENTED** | Cryptographic signatures on JWTs verified server-side. Sensitive network communications use TLS (HTTPS).                                                                                  |
| **MASVS-AUTH**     | Mobile Authentication         | **IMPLEMENTED** | Authentication handled via centralized API with short-lived JWT tokens. Session state invalidated upon logout.                                                                            |
| **MASVS-NETWORK**  | Network Communication         | **IMPLEMENTED** | All API traffic transmitted over HTTPS in production. Server verifies content types and rejects invalid payloads.                                                                         |
| **MASVS-PLATFORM** | Platform Interaction          | **IMPLEMENTED** | Least-privilege permissions requested. Missing or denied permissions fall back gracefully to `CapabilityStatus.Unavailable` without crashing or falsely claiming verified security state. |
| **MASVS-CODE**     | Code Quality & Anti-Tampering | **IMPLEMENTED** | TypeScript strict mode, ESLint validation, deterministic security engine invariants, no dynamic `eval` or unsafe code paths.                                                              |
