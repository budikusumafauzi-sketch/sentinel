# Sentinel — Project Master Documentation & Pre-Phase-10 Repository Audit

```
========================================================================================
  PROJECT:        Sentinel — Personal Cybersecurity Intelligence
  DOCUMENT:       docs/SENTINEL_PROJECT_MASTER_DOCUMENTATION.md
  REVISION:       1.0.0 (Pre-Phase-10 Authoritative Baseline)
  AUDIT DATE:     September 4, 2026
  AUDIT SCOPE:    Phases 1–9 Complete Verification (Monorepo, Backend, Mobile, Desktop,
                  Security Engine, AI, Threat Intelligence, Security Hardening)
  REPOSITORY:     D:\AI\Projects\sentinel
  BRANCH:         main
  LATEST COMMIT:  5394f98 ("feat: harden sentinel security")
  STATUS:         AUTHORITATIVE SINGLE SOURCE OF TRUTH (LOCKED BASELINE)
========================================================================================
```

---

## Document Metadata & Control Block

| Attribute              | Specification                                                                                                                                                    |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Project Identity**   | Sentinel — Personal Cybersecurity Intelligence                                                                                                                   |
| **Document Purpose**   | Single Source of Truth & Authoritative Technical Baseline before Phase 10                                                                                        |
| **Monorepo Strategy**  | Turborepo (`^2.5.4` / `2.10.12`) with pnpm Workspaces (`11.25.0`)                                                                                                |
| **Target Platforms**   | Android (Kotlin / React Native Expo), Windows (Native Rust Desktop Agent + WebView2), iOS (Swift foundation)                                                     |
| **Core Architecture**  | NestJS 11 + Fastify 5 + Prisma 6 + PostgreSQL 16 + Redis 7 + Deterministic Security Engine + Constrained Gemini 3.6/1.5 Flash + Multi-Source Threat Intelligence |
| **Audit Methodology**  | Direct source-code inspection, AST verification, test execution, schema analysis, Git history analysis, and configuration auditing                               |
| **Secret Safety Rule** | Strict compliance: Zero plaintext secrets or sensitive tokens exposed                                                                                            |
| **Operational Lock**   | READ-ONLY codebase constraint during this special audit phase                                                                                                    |

---

## Table of Contents

1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
2. [Complete Technology Stack Inventory](#2-complete-technology-stack-inventory)
3. [Repository Structure & Codebase Topology](#3-repository-structure--codebase-topology)
4. [Complete System Architecture & Information Flows](#4-complete-system-architecture--information-flows)
5. [Critical Credential & Authentication Audit](#5-critical-credential--authentication-audit)
6. [Complete Environment Variable Inventory](#6-complete-environment-variable-inventory)
7. [Database & Prisma ORM Inventory](#7-database--prisma-orm-inventory)
8. [Comprehensive Backend API Inventory](#8-comprehensive-backend-api-inventory)
9. [Device Intelligence Architecture & Platform Capabilities](#9-device-intelligence-architecture--platform-capabilities)
10. [Deterministic Security Engine Specification](#10-deterministic-security-engine-specification)
11. [AI Intelligence Architecture & Gemini Audit](#11-ai-intelligence-architecture--gemini-audit)
12. [Threat Intelligence Subsystem Inventory](#12-threat-intelligence-subsystem-inventory)
13. [Windows Desktop Security Agent Architecture](#13-windows-desktop-security-agent-architecture)
14. [Mobile Application & Cross-Platform UI/UX Inventory](#14-mobile-application--cross-platform-uiux-inventory)
15. [Security Hardening & Trust Boundary Audit](#15-security-hardening--trust-boundary-audit)
16. [Comprehensive Testing & Verification Status](#16-comprehensive-testing--verification-status)
17. [Infrastructure, Docker & CI/CD Pipeline](#17-infrastructure-docker--cicd-pipeline)
18. [Privacy, Data Governance & Sanitization Boundaries](#18-privacy-data-governance--sanitization-boundaries)
19. [Logging, Telemetry & Failure Mode Handling](#19-logging-telemetry--failure-mode-handling)
20. [Complete Dependency Inventory](#20-complete-dependency-inventory)
21. [Phases 1–9 Verification & Milestone Audit Table](#21-phases-19-verification--milestone-audit-table)
22. [Git Version Control & Repository Integrity](#22-git-version-control--repository-integrity)
23. [Known Limitations & Residual Risks Matrix](#23-known-limitations--residual-risks-matrix)
24. [Pre-Phase-10 Readiness Assessment](#24-pre-phase-10-readiness-assessment)
25. [Master Consolidated Inventory Checklist](#25-master-consolidated-inventory-checklist)

---

## 1. Executive Summary & System Overview

**Sentinel** is a personal cybersecurity intelligence platform engineered to provide transparent, explainable, and privacy-preserving security diagnostics for personal computing devices.

### 1.1 Core Architectural Principles

- **Deterministic Supremacy:** The security score (0–100) is calculated strictly by deterministic, mathematical rules based on verified system telemetry. No AI model is ever permitted to alter or influence the device security score.
- **Data Trust & Provenance Model:** Every collected security signal carries an explicit provenance tag (`VERIFIED`, `ANALYZED`, `USER_PROVIDED`, `NOT_AVAILABLE`, `PERMISSION_REQUIRED`, or `UNABLE_TO_VERIFY`). Missing telemetry is never penalized as an insecure finding.
- **Honest Posture Reporting:** If a device exposes zero verifiable security controls, the engine emits `score: null` (`INSUFFICIENT_COVERAGE`) rather than an artificially inflated or misleading score.
- **Constrained AI Advisory:** Generative AI (Google Gemini) functions exclusively as a contextual explanation and advisory layer for verified findings, user-submitted suspicious messages, URLs, and screenshots.
- **Zero-Credential Threat Intelligence:** Sentinel correlates indicators against CISA KEV, OSV.dev, OpenPhish, and URLhaus without mandatory paid API subscriptions, operating defensive caching and strict SSRF defenses.

---

## 2. Complete Technology Stack Inventory

### 2.1 Monorepo & Root Tooling

| Component                 | Technology   | Version                     | Purpose                                                                 |
| :------------------------ | :----------- | :-------------------------- | :---------------------------------------------------------------------- |
| **Package Manager**       | `pnpm`       | `11.25.0`                   | Strict, non-flat dependency management with content-addressable storage |
| **Monorepo Orchestrator** | `Turborepo`  | `^2.5.4` (CLI `2.10.12`)    | Task graph pipeline caching for build, test, and lint across workspaces |
| **Runtime Environment**   | `Node.js`    | `>= 22.0.0` (Target `22.x`) | Primary JavaScript runtime for backend and tooling                      |
| **Language**              | `TypeScript` | `^5.8.3`                    | Strict static typing across all shared contracts and TS apps            |
| **Code Formatter**        | `Prettier`   | `^3.5.3`                    | Monorepo code style enforcement                                         |
| **Version Control**       | `Git`        | `2.43+`                     | Distributed version control on branch `main`                            |

### 2.2 Backend Application (`apps/backend`)

| Component             | Technology                              | Version                          | Purpose                                                      |
| :-------------------- | :-------------------------------------- | :------------------------------- | :----------------------------------------------------------- |
| **Framework**         | `@nestjs/core`, `@nestjs/common`        | `^11.1.3`                        | Enterprise modular IoC/DI application architecture           |
| **HTTP Engine**       | `@nestjs/platform-fastify` / `fastify`  | `^11.1.3` / `^5.12.1`            | High-throughput HTTP server with 10MB body cap               |
| **Database ORM**      | `@prisma/client` / `prisma`             | `^6.19.3`                        | Type-safe PostgreSQL client and schema manager               |
| **Authentication**    | `@nestjs/jwt`, `passport-jwt`           | `^10.2.0`, `^4.0.1`              | Stateless HMAC-SHA256 JWT validation                         |
| **Password Hashing**  | `bcrypt` / `@types/bcrypt`              | `^6.0.0`                         | Salted credential hashing (12 rounds) with timing dummy hash |
| **Validation**        | `class-validator`, `class-transformer`  | `^0.15.1`, `^0.5.1`              | Runtime DTO validation and input stripping                   |
| **Rate Limiting**     | `@nestjs/throttler`                     | `^6.5.0`                         | Global memory throttler + route-level limits                 |
| **Security Headers**  | `@fastify/helmet`                       | `^13.1.1`                        | Defensive HTTP security headers                              |
| **CORS**              | `@fastify/cors`                         | `^11.3.0`                        | Environment-aware origin restriction                         |
| **Job Queue / Cache** | `ioredis` / `bullmq` / `@nestjs/bullmq` | `^6.0.0` / `^6.3.4` / `^11.0.2`  | Redis connection, LRU cache, and async job queue             |
| **API Documentation** | `@nestjs/swagger`                       | `^11.2.0`                        | OpenAPI 3.0 interactive documentation at `/api/docs`         |
| **Test Runner**       | `jest` / `ts-jest` / `supertest`        | `^29.7.0` / `^29.3.4` / `^7.1.0` | Unit, integration, and security regression testing           |

### 2.3 Mobile Application (`apps/mobile`)

| Component                 | Technology                       | Version                | Purpose                                                      |
| :------------------------ | :------------------------------- | :--------------------- | :----------------------------------------------------------- |
| **Mobile Runtime**        | `React Native`                   | `0.79.6`               | Cross-platform native mobile foundation                      |
| **Framework & Tooling**   | `Expo` / `Expo Router`           | `~53.0.11` / `~5.1.11` | Application scaffolding, entrypoints, and file-based routing |
| **UI Library**            | `React`                          | `19.0.0`               | Component state and declarative rendering                    |
| **Native Android Module** | `Kotlin` / `Android SDK`         | Android 14+ / SDK 34+  | Hardware, keyguard, biometrics, and app discovery            |
| **Native iOS Module**     | `Swift` / `UIKit` / `Network`    | iOS 16+                | Device metadata, network state, and sandbox-safe signals     |
| **Web Adapter**           | `react-native-web`               | `~0.20.0`              | Responsive tablet and desktop browser rendering              |
| **Layout & Navigation**   | `react-native-safe-area-context` | `~5.4.0`               | Device notch and safe-area geometry management               |

### 2.4 Windows Desktop Security Agent (`apps/desktop`)

| Component                | Technology                       | Version                            | Purpose                                                     |
| :----------------------- | :------------------------------- | :--------------------------------- | :---------------------------------------------------------- |
| **Programming Language** | `Rust`                           | Edition `2021`                     | High-performance, memory-safe native Windows inspection     |
| **Async Runtime**        | `tokio`                          | `1.x` (macros, net, time, process) | Non-blocking TCP listener, IPC server, and scan executor    |
| **HTTP Client**          | `reqwest`                        | `0.12` (default-tls, json)         | HTTPS client communicating with Sentinel backend API        |
| **Windows Registry**     | `winreg`                         | `0.52`                             | Read-only HKLM/HKCU system and security inspection          |
| **Serialization**        | `serde` / `serde_json`           | `1.0` / `1.0`                      | Type-safe JSON serialization for reports and IPC            |
| **Cryptography**         | `sha2`, `hex`                    | `0.10`, `0.4`                      | Deterministic telemetry and evidence fingerprinting         |
| **Desktop UI Engine**    | Native HTML5 / CSS3 / Vanilla JS | Loopback `127.0.0.1:8765`          | Lightweight UI served via Tokio and Edge WebView2 / browser |

---

## 3. Repository Structure & Codebase Topology

```
D:\AI\Projects\sentinel
├── .cargo/                         # Cargo global configuration
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI workflow (Build, Lint, Test)
├── .gitignore                      # Root Git ignore rules (secrets, build outputs, pgdata)
├── .npmrc                          # pnpm configuration settings
├── .prettierrc / .prettierignore   # Formatting specifications
├── docker-compose.yml              # Local infrastructure (PostgreSQL 16, Redis 7)
├── package.json                    # Monorepo root scripts & dev dependencies
├── pnpm-lock.yaml                  # Authoritative frozen dependency lockfile
├── pnpm-workspace.yaml             # pnpm workspace definition (apps/*, packages/*)
├── tsconfig.json                   # Base TypeScript configuration
├── turbo.json                      # Turborepo task pipeline definition
│
├── apps/
│   ├── backend/                    # NestJS + Fastify REST API
│   │   ├── prisma/
│   │   │   ├── migrations/         # Authoritative SQL migrations
│   │   │   └── schema.prisma       # Prisma data schema & relations
│   │   ├── src/
│   │   │   ├── ai/                 # AI Subsystem (Gemini, Prompts, Validators)
│   │   │   ├── auth/               # Authentication, JWT, Bcrypt, Guards
│   │   │   ├── common/             # Global exception filters & secret sanitizer
│   │   │   ├── devices/            # Device management & history
│   │   │   ├── findings/           # Security findings API
│   │   │   ├── health/             # Health check & database/redis pings
│   │   │   ├── prisma/             # Prisma service wrapper
│   │   │   ├── queue/              # BullMQ queue module
│   │   │   ├── recommendations/    # Remediation recommendations
│   │   │   ├── redis/              # Redis client factory & connection
│   │   │   ├── scans/              # Scan orchestration & evidence sync
│   │   │   ├── scores/             # Security score persistence
│   │   │   ├── threat-intel/       # Threat Intelligence, SSRF filter, 5 Providers
│   │   │   ├── app.module.ts       # Root NestJS module
│   │   │   └── main.ts             # Application bootstrapper, Fastify setup
│   │   └── test/                   # Comprehensive Jest test suites
│   │
│   ├── desktop/                    # Native Windows Desktop Agent (Rust)
│   │   ├── src/
│   │   │   ├── inspection/         # OS, security, network, and app inspection
│   │   │   ├── api.rs              # Backend REST API client
│   │   │   ├── identity.rs         # Local persistent device identity (%APPDATA%)
│   │   │   ├── models.rs           # Rust telemetry and evidence data models
│   │   │   └── main.rs             # Tokio HTTP server, IPC guard, scan executor
│   │   ├── ui/                     # Embedded desktop web UI (HTML, CSS, JS)
│   │   └── Cargo.toml              # Rust crate dependencies & metadata
│   │
│   └── mobile/                     # React Native Expo Mobile Application
│       ├── app/                    # Expo Router file-based screens & tabs
│       │   ├── (tabs)/             # Overview, Scan, Protect, Intelligence, Profile
│       │   ├── _layout.tsx         # Root mobile application layout
│       │   └── index.tsx           # Entry redirector
│       ├── modules/
│       │   └── sentinel-device-intelligence/  # Native Expo Module (Kotlin & Swift)
│       ├── src/
│       │   ├── api/                # API client with token authorization
│       │   ├── components/         # Design system UI components & cards
│       │   ├── design-system/      # Tokens (colors, typography, spacing)
│       │   ├── hooks/              # Responsive layout & auth hooks
│       │   └── services/           # Device scanner, store & desktop bridge
│       └── test/                   # Jest React Native test suite
│
├── packages/
│   └── types/                      # Shared TypeScript Contracts & Pure Engine
│       ├── src/
│       │   ├── security-engine/    # Pure deterministic rules, scoring, risk logic
│       │   ├── threat-intel/       # Threat intelligence contracts & schemas
│       │   ├── ai.ts               # AI DTOs, schemas & prompt interfaces
│       │   └── index.ts            # Foundational API contracts & enums
│       └── package.json
│
└── docs/                           # Authoritative Documentation
    ├── architecture/               # Threat intelligence & architectural notes
    ├── security/                   # Security engine spec, baseline, OWASP alignment
    └── SENTINEL_PROJECT_MASTER_DOCUMENTATION.md  # THIS DOCUMENT
```

---

## 4. Complete System Architecture & Information Flows

### 4.1 High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Sentinel Client Layer"]
        Mobile["📱 Mobile App (React Native + Expo)<br/>Android / iOS Telemetry"]
        Desktop["💻 Desktop Agent (Rust Binary)<br/>Windows Registry & WMI Telemetry"]
        WebUI["🖥️ Local Desktop UI (127.0.0.1:8765)<br/>Edge WebView2 App Mode"]
    end

    subgraph Perimeter["Security & Gateway Perimeter"]
        Fastify["⚡ Fastify Gateway (Port 3000)<br/>10MB Limit, Helmet, Throttler"]
        AuthGuard["🛡️ JWT Auth Guard & User Context"]
        OwnershipGuard["🔒 Resource Ownership Guard (BOLA/IDOR)"]
        Sanitizer["🧼 Exception Sanitizer & Secret Redactor"]
    end

    subgraph CoreServices["Backend Intelligence Services"]
        ScanService["🔍 Scan & Telemetry Orchestrator"]
        SecEngine["⚙️ Pure Deterministic Security Engine<br/>(@sentinel/types)"]
        ThreatService["🌐 Threat Intelligence Service<br/>(CISA, OSV, URLhaus, OpenPhish)"]
        AIService["🧠 Constrained AI Intelligence Service<br/>(Gemini 3.6/1.5 Flash Provider)"]
    end

    subgraph Storage["Persistence & Cache Layer"]
        Postgres[(🐘 PostgreSQL 16 DB<br/>Prisma ORM, Parameterized)]
        RedisCache[(⚡ Redis 7 Cache & BullMQ<br/>TTL, Cooldowns, Jobs)]
    end

    Mobile -->|HTTPS / JWT Bearer| Fastify
    Desktop -->|HTTPS / JWT Bearer| Fastify
    WebUI -->|Local Loopback IPC| Desktop
    Fastify --> AuthGuard --> OwnershipGuard --> ScanService
    Fastify --> Sanitizer

    ScanService -->|Evaluate Telemetry| SecEngine
    ScanService -->|Store Reports & Findings| Postgres
    ThreatService -->|Cache Lookups & Rate Limits| RedisCache
    ThreatService -->|Ingest CVEs & URLs| ExternalFeeds["External Feeds (HTTPS)"]
    AIService -->|Advisory Explanation (Zero Score Impact)| ExternalLLM["Google Gemini API (HTTPS)"]
    AIService -.->|Cross-check URLs| ThreatService
    ScanService -.->|Persist State| Postgres
```

### 4.2 Authentication Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Client
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant Bcrypt as Bcrypt Engine
    participant DB as PostgreSQL (Prisma)
    participant JWT as JwtService

    User->>AuthCtrl: POST /api/v1/auth/login { email, password }
    AuthCtrl->>AuthService: login(LoginDto)
    Note over AuthService: Normalize: email.trim().toLowerCase()
    AuthService->>DB: user.findUnique({ where: { email } })

    alt User Not Found
        AuthService->>Bcrypt: compare(password, DUMMY_BCRYPT_HASH)
        Note over AuthService: Constant-time CPU execution prevents timing attack
        AuthService-->>User: 401 Unauthorized ("Invalid credentials")
    else User Exists
        AuthService->>Bcrypt: compare(password, user.password)
        alt Password Invalid
            AuthService-->>User: 401 Unauthorized ("Invalid credentials")
        else Password Valid
            AuthService->>JWT: sign({ sub: user.id, email: user.email })
            JWT-->>AuthService: accessToken (7d expiry)
            AuthService-->>User: 200 OK { user: { id, email, name }, accessToken }
        end
    end
```

### 4.3 Deterministic Security Scan & Scoring Data Flow

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Mobile / Desktop Agent
    participant Backend as ScansController / ScansService
    participant Engine as Deterministic Security Engine
    participant DB as PostgreSQL

    Agent->>Backend: POST /api/v1/scans { deviceId, type: "FULL" }
    Backend->>DB: Create scan record (status: PENDING)
    Backend-->>Agent: { scanId, status: "PENDING" }

    Agent->>Agent: Inspect System, Network, Security, Apps (Read-Only)
    Agent->>Backend: POST /api/v1/scans/{id}/evidence { rawEvidence, capabilities }

    Note over Backend,Engine: Pass Raw Evidence & Context to Pure Engine
    Backend->>Engine: executeSecurityEngine(options)
    Note over Engine: 1. Filter Evidence Trust (VERIFIED/ANALYZED only)
    Note over Engine: 2. Evaluate 10 Versioned Rules (SEC-SYS-*, SEC-WIN-*, SEC-APP-*)
    Note over Engine: 3. Calculate Dimensional Risk Scores (0-100)
    Note over Engine: 4. Compute Base Penalties & Category Scores (0-100)
    Note over Engine: 5. Calculate Weighted Device Score & Coverage Ratio
    Note over Engine: 6. Reconcile Finding Lifecycles & Fingerprints
    Note over Engine: 7. Emit Recommendations & Security Events
    Engine-->>Backend: CompleteScanReport & ScoreBreakdown

    Backend->>DB: Save Findings, Score, Recommendations, Events, Report
    Backend->>DB: Update scan record (status: COMPLETED, score: calculatedScore)
    Backend-->>Agent: 200 OK { scanId, score, status: "COMPLETED", summary }
```

### 4.4 AI Intelligence & Constrained Advisory Flow

```mermaid
flowchart TD
    Req["Client AI Request<br/>(Explain Finding / Threat / URL / Screenshot)"] --> AuthCheck{"JWT Valid &<br/>Resource Owned?"}
    AuthCheck -- No --> Deny["401 Unauthorized / 403 Forbidden"]
    AuthCheck -- Yes --> RateCheck{"User within<br/>15 req/min?"}
    RateCheck -- No --> RateLimit["429 Too Many Requests"]
    RateCheck -- Yes --> Sanitizer["Privacy Sanitizer<br/>(Strip IPs, emails, tokens, GUIDs, auth keys)"]
    Sanitizer --> PromptReg["Prompt Registry<br/>(Wrap in Markdown delimiters + System boundaries)"]
    PromptReg --> GeminiReq["GeminiProvider (POST /v1beta/models/...:generateContent)<br/>Strict JSON responseSchema"]
    GeminiReq --> OutputVal["OutputValidator<br/>(Schema validation & field stripping)"]
    OutputVal --> BoundaryEnforce["🔒 Invariance Enforcer<br/>(Strip any injected 'score' or 'override')"]
    BoundaryEnforce --> Res["200 OK with Advisory Explanation<br/>(provenance: deterministicEngineAuthoritative=true)"]
```

### 4.5 Threat Intelligence Pipeline Flow

```mermaid
flowchart LR
    Input["Query Indicator<br/>(URL, Domain, CVE)"] --> SSRF["SSRF & Format Validator<br/>(Reject loopback, private IPs, metadata)"]
    SSRF --> CacheCheck{"Present in<br/>Redis Cache?"}
    CacheCheck -- Hit (TTL 3600s) --> CachedResult["Return Cached Verdict"]
    CacheCheck -- Miss --> RateLimitCheck{"Provider Cooldown<br/>or Rate-Limited?"}
    RateLimitCheck -- Limit Hit --> Fallback["Degraded Graceful Verdict (UNAVAILABLE)"]
    RateLimitCheck -- Available --> ProviderDispatch{"Dispatch Provider"}

    ProviderDispatch -->|CVE| CISA["CISA KEV / OSV.dev (Zero-Cred)"]
    ProviderDispatch -->|URL / Domain| URLhaus["URLhaus Feed / OpenPhish (Zero-Cred)"]
    ProviderDispatch -->|Exposure| Exp["Exposure Provider"]

    CISA --> Normalize["Normalize Verdict<br/>(SAFE, SUSPICIOUS, MALICIOUS)"]
    URLhaus --> Normalize
    Exp --> Normalize
    Normalize --> CacheStore["Store in Redis (TTL: 1 hour)"]
    CacheStore --> FinalResult["Return Unified ThreatIntelResult"]
```

---

## 5. Critical Credential & Authentication Audit

### 5.1 Authentication Mechanism Breakdown

- **Authentication Model:** Stateless JSON Web Token (JWT) over Bearer Authorization scheme (`Authorization: Bearer <token>`).
- **Token Signing Algorithm:** HMAC-SHA256 (`HS256`).
- **Token Secret Source:** Injected into `AuthModule` asynchronously via `ConfigService.get('JWT_SECRET')`.
- **Token Expiration:** Configurable via `JWT_EXPIRES_IN`, defaults to `7d` (7 days).
- **Refresh Token Mechanism:** **NOT FOUND IN REPOSITORY**. Refresh tokens, refresh rotation, and revocation blacklists are not implemented. Access tokens remain valid until expiration.
- **Session/Current User Mechanism:** `GET /api/v1/auth/me` guarded by `JwtAuthGuard`, extracting the user payload (`sub`, `email`) via `@CurrentUser()` decorator.

### 5.2 Password & Identity Security

- **Hashing Algorithm:** `bcrypt` with **12 salt rounds** (`BCRYPT_ROUNDS = 12`).
- **Timing Attack Mitigation:** In `AuthService.login`, if the user email is not found in the database, a constant-time dummy comparison is executed against a precomputed 12-round hash (`DUMMY_BCRYPT_HASH = '$2b$12$e8f.G9YcRqmTq1kP2eQWqugB7Hj.h4m9VpPZ7a1w8x2y3z4a5b6c7'`). This prevents user enumeration via response timing discrepancies.
- **Input Validation Requirements:**
  - Password: Min length 8 characters, **max length 128 characters** (`@MaxLength(128)` to prevent bcrypt CPU exhaustion DoS).
  - Email: Validated via `@IsEmail()`, normalized via `.trim().toLowerCase()` on both registration and login.
  - Name: Optional, trimmed, max length 255 characters.

### 5.3 Authorization & Access Controls

- **Roles & Permissions:** No multi-tier RBAC table (e.g. ADMIN/USER) is present in the Prisma schema. All registered users possess equal standard user privileges over their owned resources.
- **BOLA / IDOR Protections (Verified):**
  - `DevicesService`: All device queries enforce `userId === user.id`.
  - `ScansService`: Enforces `scan.userId === user.id`.
  - `FindingsService`: Enforces `finding.scan.userId === user.id`.
  - `RecommendationsService`: Enforces `finding.scan.userId === user.id` or `device.userId === user.id`. Cross-user access returns `403 Forbidden`.
  - `AiService`: Verifies device and finding ownership prior to dispatching prompts to LLM.

### 5.4 Route Protection Matrix

| Route Pattern                | Method | Auth Required | Rate Limit       | Protection Mechanism                    |
| :--------------------------- | :----- | :------------ | :--------------- | :-------------------------------------- |
| `/api/v1/health`             | `GET`  | Public        | Global (100/min) | Health check ping                       |
| `/api/v1/auth/register`      | `POST` | Public        | **5 / min**      | Throttler, Bcrypt 12, Uniqueness        |
| `/api/v1/auth/login`         | `POST` | Public        | **10 / min**     | Throttler, Dummy hash timing guard      |
| `/api/v1/auth/me`            | `GET`  | **Required**  | Global (100/min) | `JwtAuthGuard`                          |
| `/api/v1/devices/**`         | All    | **Required**  | Global (100/min) | `JwtAuthGuard` + BOLA user scoping      |
| `/api/v1/scans/**`           | All    | **Required**  | Global (100/min) | `JwtAuthGuard` + BOLA scan ownership    |
| `/api/v1/findings/**`        | All    | **Required**  | Global (100/min) | `JwtAuthGuard` + BOLA scan ownership    |
| `/api/v1/scores/**`          | All    | **Required**  | Global (100/min) | `JwtAuthGuard` + BOLA device ownership  |
| `/api/v1/recommendations/**` | All    | **Required**  | Global (100/min) | `JwtAuthGuard` + BOLA multi-hop check   |
| `/api/v1/ai/**`              | All    | **Required**  | **15 / min**     | `JwtAuthGuard` + Throttler + Ownership  |
| `/api/v1/threat-intel/**`    | All    | **Required**  | **30 / min**     | `JwtAuthGuard` + Throttler + SSRF Guard |
| `/api/docs`                  | `GET`  | Public        | Global (100/min) | Swagger UI                              |

### 5.5 Repository Credential Audit Findings

- **Plaintext User Passwords:** NONE in repository.
- **Default / Seed User Accounts:** NONE in database migrations or code. Database initializes empty.
- **Development Infrastructure Credentials:**
  - `docker-compose.yml`: PostgreSQL user `sentinel`, password `sentinel_dev`, DB `sentinel`, port `5433`.
  - `apps/backend/.env.example`: References `postgresql://sentinel:sentinel_dev@localhost:5433/sentinel?schema=public` and placeholder `JWT_SECRET`.
- **Local Secret Isolation:** The active `apps/backend/.env` file is strictly ignored by `.gitignore` (verified via `git check-ignore`).

---

## 6. Complete Environment Variable Inventory

| Variable                          | Purpose                               | Required     | Secret  | Default / Example Value                                                    | Current Status                           | Consumed By               |
| :-------------------------------- | :------------------------------------ | :----------- | :------ | :------------------------------------------------------------------------- | :--------------------------------------- | :------------------------ |
| `NODE_ENV`                        | Application runtime mode              | Optional     | No      | `development`                                                              | CONFIGURED (`development`)               | Backend / Monorepo        |
| `PORT`                            | Backend HTTP listening port           | Optional     | No      | `3000`                                                                     | CONFIGURED (`3000`)                      | Fastify Adapter           |
| `DATABASE_URL`                    | PostgreSQL connection string          | **Required** | **Yes** | `postgresql://sentinel:sentinel_dev@localhost:5433/sentinel?schema=public` | CONFIGURED (Local Dev DB)                | Prisma ORM                |
| `REDIS_HOST`                      | Redis host address                    | **Required** | No      | `localhost`                                                                | CONFIGURED (`localhost`)                 | RedisModule / BullMQ      |
| `REDIS_PORT`                      | Redis TCP port                        | **Required** | No      | `6379`                                                                     | CONFIGURED (`6379`)                      | RedisModule / BullMQ      |
| `JWT_SECRET`                      | Secret key for signing JWTs           | **Required** | **Yes** | `CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING`                           | CONFIGURED (Local Dev Secret)            | JwtStrategy / AuthModule  |
| `JWT_EXPIRES_IN`                  | JWT token validity window             | Optional     | No      | `7d`                                                                       | CONFIGURED (`7d`)                        | AuthModule                |
| `SENTINEL_GEMINI_API_KEY`         | Google Gemini API authentication      | Optional*    | **Yes** | `your_gemini_api_key_here`                                                 | CONFIGURED (`AQ.A...ldRg` masked)        | GeminiProvider            |
| `SENTINEL_GEMINI_MODEL`           | Gemini LLM model identifier           | Optional     | No      | `gemini-3.6-flash`                                                         | CONFIGURED (`gemini-3.6-flash`)          | GeminiProvider            |
| `GEMINI_API_KEY`                  | Secondary fallback Gemini API key     | Optional     | **Yes** | None                                                                       | NOT CONFIGURED                           | GeminiProvider            |
| `GEMINI_MODEL`                    | Secondary fallback Gemini model       | Optional     | No      | `gemini-3.6-flash`                                                         | NOT CONFIGURED                           | GeminiProvider            |
| `THREAT_INTEL_URLHAUS_API_KEY`    | abuse.ch Auth-Key for direct queries  | Optional     | **Yes** | `your_abuse_ch_auth_key_here`                                              | NOT CONFIGURED (Zero-cred feed mode)     | UrlhausProvider           |
| `THREAT_INTEL_CACHE_TTL_SECONDS`  | Redis cache TTL for threat lookups    | Optional     | No      | `3600`                                                                     | CONFIGURED (`3600` via example/defaults) | ThreatIntelCacheService   |
| `THREAT_INTEL_REQUEST_TIMEOUT_MS` | HTTP request timeout for feeds        | Optional     | No      | `5000`                                                                     | CONFIGURED (`5000` via example/defaults) | ThreatIntelService        |
| `SENTINEL_BACKEND_URL`            | Backend URL for Desktop Agent         | Optional     | No      | `http://localhost:3000/api/v1`                                             | RUNTIME DEFAULT                          | Desktop Agent (`main.rs`) |
| `SENTINEL_AUTH_TOKEN`             | Pre-authenticated JWT for Desktop CLI | Optional     | **Yes** | None                                                                       | RUNTIME OPTIONAL                         | Desktop Agent (`main.rs`) |
| `SENTINEL_EMAIL`                  | Headless login email for Desktop      | Optional     | No      | None                                                                       | RUNTIME OPTIONAL                         | Desktop Agent (`main.rs`) |
| `SENTINEL_PASSWORD`               | Headless login password for Desktop   | Optional     | **Yes** | None                                                                       | RUNTIME OPTIONAL                         | Desktop Agent (`main.rs`) |

_\*Note: `SENTINEL_GEMINI_API_KEY` is optional for core security operations; if absent, AI endpoints return clean `CONFIG_MISSING` errors without degrading deterministic security scoring._

---

## 7. Database & Prisma ORM Inventory

### 7.1 Database Engine & Connection

- **Engine:** PostgreSQL 16 Alpine (`postgres:16-alpine`).
- **Container Name:** `sentinel-postgres`.
- **Default Port:** `5433` (host) mapped to `5432` (container).
- **Volume:** `sentinel_pgdata` (persistent Docker volume).
- **Client ORM:** Prisma Client `^6.19.3`.

### 7.2 Schema Models & Relationship Topography

```mermaid
erDiagram
    User ||--o{ Device : owns
    User ||--o{ Scan : initiates
    User ||--o{ SecurityScore : receives
    User ||--o{ SecurityHistory : tracks
    User ||--o{ SecurityEvent : records

    Device ||--o{ Scan : undergoes
    Device ||--o{ SecurityScore : receives
    Device ||--o{ SecurityHistory : tracks
    Device ||--o{ SecurityEvent : records

    Scan ||--o{ Finding : identifies
    Scan ||--o{ SecurityScore : calculates
    Scan ||--o{ SecurityHistory : records
    Scan ||--o{ SecurityEvent : produces

    Finding ||--o{ Recommendation : generates
```

### 7.3 Detailed Model Attributes

#### 1. `User` (Table: `users`)

- `id`: String (UUID v4, PK).
- `email`: String (Unique, Indexed).
- `password`: String (Bcrypt hash).
- `name`: String (Nullable).
- `createdAt`, `updatedAt`: Timestamps.

#### 2. `Device` (Table: `devices`)

- `id`: String (UUID v4, PK).
- `userId`: String (FK -> `users.id`, ON DELETE CASCADE).
- `name`: String.
- `platform`: Enum `DevicePlatform` (`ANDROID`, `IOS`, `WINDOWS`, `MACOS`, `LINUX`).
- `osVersion`, `model`, `manufacturer`: Strings (Nullable).
- `isActive`: Boolean (Default: `true`).
- `lastSeenAt`: Timestamp (Nullable).
- Indexes: `[userId]`.

#### 3. `Scan` (Table: `scans`)

- `id`: String (UUID v4, PK).
- `userId`: String (FK -> `users.id`, ON DELETE CASCADE).
- `deviceId`: String (FK -> `devices.id`, ON DELETE CASCADE).
- `type`: Enum `ScanType` (`QUICK`, `FULL`, `CUSTOM`, Default: `QUICK`).
- `status`: Enum `ScanStatus` (`PENDING`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELLED`).
- `score`: Int (Nullable, 0–100).
- `evaluatedControls`: Int (Nullable).
- `unavailableChecks`: Int (Nullable).
- `report`: Json (Nullable, structured `CompleteScanReport`).
- `rawEvidence`, `capabilities`: Json (Nullable).
- `startedAt`, `completedAt`: Timestamps.
- Indexes: `[userId]`, `[deviceId]`, `[status]`.

#### 4. `Finding` (Table: `findings`)

- `id`: String (UUID v4, PK).
- `scanId`: String (FK -> `scans.id`, ON DELETE CASCADE).
- `deviceId`: String (Nullable, Indexed).
- `fingerprint`: String (Nullable, Indexed, Deterministic deduplication hash).
- `ruleId`, `rulesetVersion`: Strings (Nullable).
- `category`: Enum `FindingCategory` (`DEVICE`, `APPLICATIONS`, `ACCOUNTS`, `SYSTEM`, `APPLICATION`, `NETWORK`, `PRIVACY`, `AUTHENTICATION`, `ENCRYPTION`, `PERMISSIONS`, `UPDATE`, `CONFIGURATION`, `OTHER`).
- `title`: String.
- `description`, `explanation`, `remediation`: Strings (Nullable).
- `severity`: Enum `FindingSeverity` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
- `riskScore`: Int (Nullable, 0–100).
- `priority`: String (Nullable).
- `status`: Enum `FindingStatus` (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`, `FALSE_POSITIVE`).
- `confidence`: Float (Nullable, 0.0–1.0).
- `evidence`: Json (Nullable, telemetry array).
- Indexes: `[scanId]`, `[deviceId]`, `[fingerprint]`, `[severity]`, `[status]`.

#### 5. `SecurityScore` (Table: `security_scores`)

- `id`: String (UUID v4, PK).
- `userId`: String (FK -> `users.id`, ON DELETE CASCADE).
- `deviceId`: String (FK -> `devices.id`, ON DELETE CASCADE).
- `scanId`: String (Nullable, FK -> `scans.id`, ON DELETE SET NULL).
- `overallScore`: Int (0–100).
- `scoreVersion`, `riskModelVersion`, `rulesetVersion`: Strings.
- `evaluatedControlCount`, `unavailableCheckCount`: Ints.
- `categoryScores`, `findingContributions`: Json.
- `calculatedAt`: Timestamp (Indexed).

#### 6. `Recommendation` (Table: `recommendations`)

- `id`: String (UUID v4, PK).
- `findingId`: String (Nullable, FK -> `findings.id`, ON DELETE SET NULL).
- `deviceId`: String (Nullable, Indexed).
- `findingFingerprint`: String (Nullable, Indexed).
- `title`, `description`, `actionUrl`: Strings.
- `priority`: Enum `RecommendationPriority` (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- `status`: Enum `RecommendationStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `DISMISSED`, `EXPIRED`).

#### 7. `SecurityHistory` (Table: `security_histories`)

- `id`: String (UUID v4, PK).
- `userId`, `deviceId`, `scanId`: FKs (ON DELETE CASCADE).
- `overallScore`, `scoreDelta`: Ints.
- `evaluatedControls`, `unavailableChecks`: Ints.
- `coverage`: Float.
- `trend`: String (`IMPROVED`, `DEGRADED`, `STABLE`, `INITIAL`).
- `recordedAt`: Timestamp (Indexed).

#### 8. `SecurityEvent` (Table: `security_events`)

- `id`: String (UUID v4, PK).
- `userId`, `deviceId`: FKs (ON DELETE CASCADE).
- `scanId`: String (Nullable, FK -> `scans.id`).
- `type`, `title`, `description`: Strings.
- `severity`: Enum `FindingSeverity` (Nullable).
- `metadata`: Json.
- `createdAt`: Timestamp (Indexed).

### 7.4 Migration History & Critical Observation

- **Migration Directory:** `apps/backend/prisma/migrations/20260903075049_init/migration.sql`.
- **Audit Discrepancy Note:** The initial migration establishes the base tables (`users`, `devices`, `scans`, `findings`, `security_scores`, `recommendations`). The Phase 5 extensions (`SecurityHistory`, `SecurityEvent`, updated columns) were added to `schema.prisma` in commit `1882ee9` and synchronized in development using Prisma runtime sync (`prisma db push`).
- **Pre-Phase-10 Status:** No pending migration drift in code, but a formal migration (`prisma migrate dev`) should be committed prior to production deployment.

---

## 8. Comprehensive Backend API Inventory

The Sentinel backend exposes **37 HTTP endpoints** under the URI version prefix `/api/v1`:

| #   | Method | Endpoint                                   | Auth   | Purpose                              | Request Body / Query Params                                               |
| :-- | :----- | :----------------------------------------- | :----- | :----------------------------------- | :------------------------------------------------------------------------ |
| 1   | `GET`  | `/api/v1/health`                           | Public | System health check (DB + Redis)     | None                                                                      |
| 2   | `POST` | `/api/v1/auth/register`                    | Public | Register user account                | `RegisterDto` `{ email, password, name? }`                                |
| 3   | `POST` | `/api/v1/auth/login`                       | Public | Authenticate user & issue JWT        | `LoginDto` `{ email, password }`                                          |
| 4   | `GET`  | `/api/v1/auth/me`                          | JWT    | Get current user profile             | None                                                                      |
| 5   | `POST` | `/api/v1/devices`                          | JWT    | Register new device                  | `CreateDeviceDto` `{ name, platform, osVersion?, model?, manufacturer? }` |
| 6   | `GET`  | `/api/v1/devices`                          | JWT    | List user's registered devices       | None                                                                      |
| 7   | `GET`  | `/api/v1/devices/:id`                      | JWT    | Retrieve device details by ID        | Path: `:id` (UUID)                                                        |
| 8   | `GET`  | `/api/v1/devices/:id/history`              | JWT    | Get device security history records  | Path: `:id` (UUID)                                                        |
| 9   | `GET`  | `/api/v1/devices/:id/events`               | JWT    | Get device security events           | Path: `:id` (UUID)                                                        |
| 10  | `POST` | `/api/v1/scans`                            | JWT    | Initiate a new security scan         | `CreateScanDto` `{ deviceId, type? }`                                     |
| 11  | `POST` | `/api/v1/scans/:id/evidence`               | JWT    | Synchronize evidence & run engine    | `SyncEvidenceDto` `{ rawEvidence[500], capabilities, deviceInfo? }`       |
| 12  | `GET`  | `/api/v1/scans`                            | JWT    | List scans for current user          | None                                                                      |
| 13  | `GET`  | `/api/v1/scans/:id`                        | JWT    | Get scan record and its findings     | Path: `:id` (UUID)                                                        |
| 14  | `GET`  | `/api/v1/scans/:id/report`                 | JWT    | Get structured JSON scan report      | Path: `:id` (UUID)                                                        |
| 15  | `POST` | `/api/v1/findings`                         | JWT    | Record finding manually/direct       | `CreateFindingDto` `{ scanId, title, category, severity, ... }`           |
| 16  | `GET`  | `/api/v1/findings`                         | JWT    | List findings for a scan             | Query: `scanId` (UUID)                                                    |
| 17  | `GET`  | `/api/v1/findings/device/:deviceId`        | JWT    | List findings for a device           | Path: `:deviceId` (UUID)                                                  |
| 18  | `GET`  | `/api/v1/findings/:id`                     | JWT    | Retrieve finding by ID               | Path: `:id` (UUID)                                                        |
| 19  | `POST` | `/api/v1/scores`                           | JWT    | Persist security score record        | `CreateScoreDto` `{ deviceId, overallScore, categoryScores? }`            |
| 20  | `GET`  | `/api/v1/scores`                           | JWT    | Get scores history for a device      | Query: `deviceId` (UUID)                                                  |
| 21  | `GET`  | `/api/v1/scores/latest`                    | JWT    | Get most recent score for device     | Query: `deviceId` (UUID)                                                  |
| 22  | `POST` | `/api/v1/recommendations`                  | JWT    | Create remediation recommendation    | `CreateRecommendationDto` `{ findingId?, title, priority, ... }`          |
| 23  | `GET`  | `/api/v1/recommendations`                  | JWT    | List recommendations by finding      | Query: `findingId` (UUID)                                                 |
| 24  | `GET`  | `/api/v1/recommendations/device/:deviceId` | JWT    | List recommendations for device      | Path: `:deviceId` (UUID)                                                  |
| 25  | `GET`  | `/api/v1/recommendations/:id`              | JWT    | Retrieve recommendation by ID        | Path: `:id` (UUID)                                                        |
| 26  | `POST` | `/api/v1/ai/findings/:id/explain`          | JWT    | Explain finding with AI (Advisory)   | Path: `:id` (UUID)                                                        |
| 27  | `POST` | `/api/v1/ai/advisor`                       | JWT    | Get prioritized security guidance    | `SecurityAdvisorDto` `{ deviceId }`                                       |
| 28  | `POST` | `/api/v1/ai/threat`                        | JWT    | Analyze threat text description      | `ThreatAnalysisDto` `{ threatInput, context? }`                           |
| 29  | `POST` | `/api/v1/ai/message`                       | JWT    | Analyze suspicious SMS/phishing text | `MessageAnalysisDto` `{ messageText, sender? }`                           |
| 30  | `POST` | `/api/v1/ai/url`                           | JWT    | Syntactic & Threat-Intel URL check   | `UrlAnalysisDto` `{ url }`                                                |
| 31  | `POST` | `/api/v1/ai/screenshot`                    | JWT    | Analyze UI screenshot base64 image   | `ScreenshotAnalysisDto` `{ imageBase64, mimeType, contextNote? }`         |
| 32  | `POST` | `/api/v1/threat-intel/query`               | JWT    | Query threat intel by type           | `QueryThreatIntelDto` `{ type, indicator, forceRefresh? }`                |
| 33  | `POST` | `/api/v1/threat-intel/url`                 | JWT    | Evaluate URL against feeds           | `UrlThreatDto` `{ url, forceRefresh? }`                                   |
| 34  | `POST` | `/api/v1/threat-intel/domain`              | JWT    | Evaluate domain against feeds        | `DomainThreatDto` `{ domain, forceRefresh? }`                             |
| 35  | `POST` | `/api/v1/threat-intel/cve`                 | JWT    | Query CVE in CISA KEV / OSV          | `CveThreatDto` `{ cveId, forceRefresh? }`                                 |
| 36  | `POST` | `/api/v1/threat-intel/exposure`            | JWT    | Query defensive exploitation risk    | `ExposureThreatDto` `{ indicator, indicatorType?, forceRefresh? }`        |
| 37  | `GET`  | `/api/v1/threat-intel/providers`           | JWT    | List registered provider descriptors | None                                                                      |

---

## 9. Device Intelligence Architecture & Platform Capabilities

### 9.1 Data Trust Model (Information Provenance)

Every signal gathered by Sentinel carries an explicit provenance rating defined in `@sentinel/types`:

- `VERIFIED`: Directly inspected and cryptographically/systemically verified via authorized OS APIs.
- `ANALYZED`: Derived deterministically from verified evidence through multi-signal correlation.
- `USER_PROVIDED`: Explicitly affirmed by the device owner.
- `NOT_AVAILABLE`: Platform sandbox or operating system does not expose the requested signal.
- `PERMISSION_REQUIRED`: Check is supported but requires explicit user permission grant.
- `UNABLE_TO_VERIFY`: System attempted inspection but the underlying service/command failed.

### 9.2 Platform Capability Matrix

| Capability Identifier    | Android (Kotlin)                          | Windows (Rust Agent)                   | iOS (Swift)                   | Evidence Check ID              |
| :----------------------- | :---------------------------------------- | :------------------------------------- | :---------------------------- | :----------------------------- |
| **Device Metadata**      | `SUPPORTED`                               | `SUPPORTED`                            | `SUPPORTED`                   | `device.metadata`              |
| **OS Version & Build**   | `SUPPORTED`                               | `SUPPORTED`                            | `SUPPORTED`                   | `os.version`                   |
| **Security Patch Date**  | `SUPPORTED` (API 23+)                     | `SUPPORTED` (Build UBR)                | `NOT_AVAILABLE`               | `os.security_patch`            |
| **Screen Lock Active**   | `SUPPORTED` (`KeyguardManager`)           | `SUPPORTED` (ScreenSaver)              | `NOT_AVAILABLE` (Sandbox)     | `security.screen_lock`         |
| **Biometrics Enrolled**  | `SUPPORTED` (`BiometricManager`)          | `UNABLE_TO_VERIFY`                     | `PARTIALLY_SUPPORTED`         | `security.biometrics`          |
| **Storage Encryption**   | `SUPPORTED` (`DevicePolicyManager`)       | `SUPPORTED` (BitLocker)                | `SUPPORTED` (Data Protection) | `security.storage_encryption`  |
| **Developer Options**    | `SUPPORTED` (`Settings.Global`)           | `SUPPORTED` (AppModelUnlock)           | `NOT_AVAILABLE`               | `os.developer_mode`            |
| **USB / ADB Debugging**  | `SUPPORTED` (`Settings.Global`)           | `NOT_AVAILABLE`                        | `NOT_AVAILABLE`               | `security.adb_enabled`         |
| **Unknown App Sources**  | `SUPPORTED` (`canRequestPackageInstalls`) | `NOT_AVAILABLE`                        | `NOT_AVAILABLE`               | `security.unknown_sources`     |
| **Firewall Status**      | `NOT_AVAILABLE`                           | `SUPPORTED` (`netsh advfirewall`)      | `NOT_AVAILABLE`               | `security.firewall_active`     |
| **Antivirus Protection** | `NOT_AVAILABLE`                           | `SUPPORTED` (WMI / SecurityCenter)     | `NOT_AVAILABLE`               | `security.antivirus_active`    |
| **User Account Control** | `NOT_AVAILABLE`                           | `SUPPORTED` (Registry `EnableLUA`)     | `NOT_AVAILABLE`               | `security.uac_active`          |
| **Secure Boot / TPM**    | `NOT_AVAILABLE`                           | `SUPPORTED` (Confirm-SecureBoot / Tpm) | `NOT_AVAILABLE`               | `security.secure_boot_enabled` |
| **App Inventory**        | `PARTIALLY_SUPPORTED` (API 30+ filter)    | `SUPPORTED` (Uninstall Registry)       | `NOT_AVAILABLE` (iOS Sandbox) | `app.inventory`                |
| **Network Interfaces**   | `SUPPORTED` (`ConnectivityManager`)       | `SUPPORTED` (`netsh interface`)        | `SUPPORTED` (`NWPathMonitor`) | `network.interfaces`           |
| **VPN Active Detection** | `SUPPORTED` (`TRANSPORT_VPN`)             | `SUPPORTED` (Adapter check)            | `PARTIALLY_SUPPORTED`         | `network.vpn_active`           |
| **Wi-Fi SSID**           | `PERMISSION_REQUIRED` (Location)          | `SUPPORTED` (`netsh wlan`)             | `PERMISSION_REQUIRED`         | `network.wifi_security`        |

---

## 10. Deterministic Security Engine Specification

### 10.1 Engine Philosophy & Location

The core Security Engine resides in `@sentinel/types/src/security-engine`. It is implemented as pure, side-effect-free TypeScript functions without database, native, or network dependencies. It runs identically in the backend server and mobile client offline environments.

### 10.2 Scoring Range & Canonical Bands

- **Score Range:** `0` (Critical Vulnerability) to `100` (Optimal Hygiene).
- **Postures:**
  - `80` – `100`: **Healthy / Secure** (Cyan / Emerald).
  - `50` – `79`: **Attention Needed** (Amber / Orange).
  - `0` – `49`: **Critical Action Required** (Red / Crimson).
  - `null`: **Insufficient Coverage** (Reported when 0 controls were verifiable).

### 10.3 Versioned Rule Catalog (`RULESET_VERSION = "1.0.0"`)

The engine executes **10 deterministic rules**:

1. `SEC-SYS-SCREEN-LOCK`: Triggers if screen lock is explicitly `false` (`HIGH` severity, 25 pt base penalty).
2. `SEC-SYS-STORAGE-ENCRYPTION`: Triggers if storage encryption is `INACTIVE` (`HIGH` severity, 25 pt base penalty).
3. `SEC-SYS-SECURITY-PATCH-AGE`: Triggers if security patch age exceeds 90 days (`MEDIUM` severity, 12 pt base penalty).
4. `SEC-SYS-DEV-OPTIONS`: Triggers if developer mode is enabled on a non-emulator device (`LOW` severity, 5 pt base penalty).
5. `SEC-SYS-UNKNOWN-SOURCES`: Triggers if sideloading from unknown sources is enabled (`MEDIUM` severity, 12 pt base penalty).
6. `SEC-APP-EXCESSIVE-PERMS`: Triggers if non-system app requests dangerous permission combinations (SMS + Contacts + Overlay) (`MEDIUM` severity, 12 pt base penalty).
7. `SEC-APP-SIDELOADED`: Triggers if application installer is not an approved store (`LOW` severity, 5 pt base penalty).
8. `SEC-WIN-FIREWALL`: Triggers if any Windows firewall profile (Domain, Private, Public) is disabled (`HIGH` severity, 25 pt base penalty).
9. `SEC-WIN-ANTIVIRUS`: Triggers if Windows Defender / third-party AV is disabled or out of date (`HIGH` severity, 25 pt base penalty).
10. `SEC-WIN-UAC`: Triggers if Windows User Account Control is disabled (`MEDIUM` severity, 12 pt base penalty).

### 10.4 Scoring Mathematics & Traceability

- **Base Penalties:** `CRITICAL: 40`, `HIGH: 25`, `MEDIUM: 12`, `LOW: 5`.
- **Finding Penalty Formula:**
  $$\text{Penalty} = \text{BasePenalty} \times \left(\frac{\text{RiskScore}}{100}\right)$$
- **Category Score Formula:**
  $$\text{CategoryScore} = \max\left(0, 100 - \sum \text{Penalty}\right)$$
- **Overall Device Score:** Weighted average of evaluated categories, weighted by the number of evaluated controls in each category. Categories with 0 evaluated controls are completely omitted from the denominator.

---

## 11. AI Intelligence Architecture & Gemini Audit

### 11.1 Subsystem Architecture

The AI subsystem is located in `apps/backend/src/ai`. It uses an abstract provider interface (`AiProvider`), implemented by `GeminiProvider` (production) and `MockAiProvider` (testing).

```
Client Request
      │
      ▼
AiController (Rate Limit: 15 req/min, JWT Required)
      │
      ▼
AiService
      ├── Ownership Verification (Device / Finding belongs to User)
      ├── Privacy Sanitizer (Strips PII, IP addresses, credentials)
      ├── PromptRegistry (Delimited system instructions)
      └── GeminiProvider (google-genai / REST)
            │
            ├── Timeout: 60,000 ms
            ├── Retries: 4 attempts with exponential backoff & 'retry in Xs' parsing
            └── Strict JSON responseSchema enforcement
      │
      ▼
OutputValidator
      ├── Schema Validation
      ├── Source Attribution & Provenance
      └── 🔒 Score Invariance Boundary (Strips any injected scores)
```

### 11.2 Gemini Credential & Operational Status

- **Environment Variable:** `SENTINEL_GEMINI_API_KEY` (fallback `GEMINI_API_KEY`).
- **Configured Status:** **CONFIGURED** in `apps/backend/.env`.
- **Masked Representation:** `AQ.A...ldRg` (Masked for security).
- **Model Configured:** `SENTINEL_GEMINI_MODEL=gemini-3.6-flash`.
- **Git Ignored:** **YES** (`apps/backend/.env` is ignored by Git).
- **Runtime Verification:** Successfully verified via live test execution (`ba43573`).
- **Failure Behavior:** If the API key is absent, requests return `401 Unauthorized` with structured error code `CONFIG_MISSING`. Deterministic scanning remains 100% operational.

### 11.3 AI Operations Catalog

1. `explainFinding`: Contextual explanation of a deterministic finding.
2. `getSecurityAdvisor`: Prioritized recommendations based on device telemetry.
3. `analyzeThreat`: Natural language interpretation of threat descriptions.
4. `analyzeMessage`: Phishing and social engineering heuristic analysis.
5. `analyzeUrl`: Syntactic analysis cross-correlated with live Threat Intelligence.
6. `analyzeScreenshot`: Vision analysis of suspicious security prompts/popups (in-memory only, images are never written to disk or DB).

---

## 12. Threat Intelligence Subsystem Inventory

### 12.1 Provider Registry

| Provider Name          | Source / URL                                        | Intelligence Type | Credential Requirement           | Failover / Isolation             |
| :--------------------- | :-------------------------------------------------- | :---------------- | :------------------------------- | :------------------------------- |
| **CISA KEV**           | CISA Known Exploited Vulnerabilities Catalog        | `CVE`             | **Zero-Cred** (Public JSON)      | Cache fallback, degraded verdict |
| **OSV.dev**            | Open Source Vulnerabilities (`api.osv.dev`)         | `CVE`             | **Zero-Cred** (Public REST)      | 5s timeout, circuit breaker      |
| **URLhaus**            | abuse.ch URLhaus Feed                               | `URL`, `DOMAIN`   | **Zero-Cred** (Optional API key) | Cache fallback, 10s cooldown     |
| **OpenPhish**          | OpenPhish Community Feed (`openphish.com/feed.txt`) | `URL`, `DOMAIN`   | **Zero-Cred** (Public Feed)      | In-memory stream parse fallback  |
| **Defensive Exposure** | Sentinel Correlated Engine                          | `EXPOSURE`        | **Zero-Cred** (Internal logic)   | Pure calculation                 |

### 12.2 SSRF Protection & Normalization (`ThreatIntelValidator`)

- **Loopback Rejection:** Rejects `127.0.0.0/8`, `localhost`, `::1`, `[::1]`.
- **Private IP Rejection:** Rejects RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Cloud Metadata Rejection:** Rejects `169.254.169.254`, `metadata.google.internal`.
- **IPv6 Perimeter:** Rejects unspecified (`::`), IPv4-mapped IPv6 (`::ffff:...`), link-local (`fe80::`), unique local (`fc00::`, `fd00::`).
- **URL Sanitization:** Strips userinfo (`user:pass@`), sensitive query params (`token`, `api_key`, `jwt`), and fragments (`#...`).

---

## 13. Windows Desktop Security Agent Architecture

### 13.1 Agent Architecture & Binary

- **Source Code:** `apps/desktop` (Rust Edition 2021).
- **Executable:** `sentinel-desktop.exe` (`cargo build --release`).
- **Listening Interface:** Loopback TCP server strictly bound to `127.0.0.1:8765`.

### 13.2 Local IPC Security Controls

To prevent DNS rebinding and cross-origin attacks from web browsers:

1. **Host Header Validation:** Rejects any request where `Host` is not `127.0.0.1:8765` or `localhost:8765`.
2. **Origin Header Validation:** If `Origin` is present, it must strictly match `http://127.0.0.1:8765`, `http://localhost:8765`, or `null` (local curl/CLI). External web origins are rejected with `403 Forbidden`.
3. **Referer Validation:** Foreign referers are strictly rejected.
4. **CORS:** Disallows wildcard `*`; strictly reflects `http://127.0.0.1:8765`.

### 13.3 Windows Telemetry Sources

- **Firewall:** `netsh advfirewall show allprofiles state`.
- **Antivirus:** Windows Security Center API and WMI queries.
- **UAC:** Registry `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\EnableLUA`.
- **Secure Boot & TPM:** Registry and PowerShell WMI status.
- **BitLocker:** Drive encryption status inspection.
- **Installed Applications:** 64-bit, 32-bit, and HKCU Uninstall registry subkeys.

---

## 14. Mobile Application & Cross-Platform UI/UX Inventory

### 14.1 Design System Tokens

- **Theme Philosophy:** Cyberpunk-inspired dark aesthetic ("Sentinel Midnight").
- **Colors:**
  - Background: `#050811` (Deep Obsidian).
  - Surface / Card: `#0A0F1D` / `#0F172A` (Dark Slate Navy).
  - Primary / Accent: `#00F0FF` (Electric Cyan) and `#10B981` (Cyber Emerald).
  - Severity Tokens: Critical `#EF4444`, High `#F97316`, Medium `#FBBF24`, Low `#3B82F6`, Info `#64748B`.
- **Typography:** Modern sans-serif stack with tabular numbers for security scores.

### 14.2 Screen & Navigation Inventory

The mobile app utilizes Expo Router file-based navigation with 5 primary tabs:

1. **Overview (`app/(tabs)/index.tsx`):** Displays the circular Security Score Gauge, device posture summary, active risk banners, and quick-action scan triggers.
2. **Scan (`app/(tabs)/scan.tsx`):** Interactive scan launcher (Quick, Full, Custom), real-time progress indicators, and full inspection report viewer.
3. **Protect (`app/(tabs)/protect.tsx`):** Actionable recommendations card stack, categorized finding management, and remediation checklists.
4. **Intelligence (`app/(tabs)/intelligence.tsx`):** AI Threat Analyzer, URL Scanner, Suspicious Message Analyzer, and live Threat Feed indicators.
5. **Profile (`app/(tabs)/profile.tsx`):** Device management, session details, backend connectivity status, and data trust transparency.

---

## 15. Security Hardening & Trust Boundary Audit

### 15.1 Hardening Implementation Status

| Security Control               | Implementation Location        | Verification Status       | Notes                                                  |
| :----------------------------- | :----------------------------- | :------------------------ | :----------------------------------------------------- |
| **Timing Attack Defense**      | `AuthService.login`            | **VERIFIED** (Unit Test)  | Dummy 12-round bcrypt comparison on non-existent users |
| **Email Normalization**        | `AuthService.register`/`login` | **VERIFIED** (Unit Test)  | Trims whitespace, forces lowercase                     |
| **Bcrypt DoS Protection**      | `LoginDto` / `RegisterDto`     | **VERIFIED** (Unit Test)  | Max 128 characters enforced                            |
| **IDOR / BOLA Prevention**     | Scans, Devices, Findings, Recs | **VERIFIED** (Unit Test)  | Multi-hop ownership validation (`403 Forbidden`)       |
| **SSRF IPv4 Filtering**        | `ThreatIntelValidator`         | **VERIFIED** (Unit Test)  | Blocks loopback, RFC 1918, link-local, multicast       |
| **SSRF IPv6 Filtering**        | `ThreatIntelValidator`         | **VERIFIED** (Unit Test)  | Blocks loopback (`::1`), IPv4-mapped, unique-local     |
| **Cloud Metadata Protection**  | `ThreatIntelValidator`         | **VERIFIED** (Unit Test)  | Blocks `169.254.169.254`, Google metadata hostnames    |
| **Sensitive URL Stripping**    | `ThreatIntelValidator`         | **VERIFIED** (Unit Test)  | Strips userinfo, tokens, auth keys, fragments          |
| **Exception Secret Redaction** | `AllExceptionsFilter`          | **VERIFIED** (Unit Test)  | Masks DB strings, Bearer tokens, hides 500 stacks      |
| **Score Invariance Boundary**  | `OutputValidator`              | **VERIFIED** (Unit Test)  | Strips injected scores and overrides from AI output    |
| **Body Size Limit**            | `FastifyAdapter` in `main.ts`  | **VERIFIED** (Code Audit) | 10 MB ceiling (`bodyLimit: 10485760`)                  |
| **Rate Limiting (Global)**     | `AppModule` / `ThrottlerGuard` | **VERIFIED** (Code Audit) | Global 100 req/min                                     |
| **Rate Limiting (Auth)**       | `AuthController`               | **VERIFIED** (Code Audit) | Register: 5/min, Login: 10/min                         |
| **Rate Limiting (AI)**         | `AiController`                 | **VERIFIED** (Code Audit) | AI operations: 15/min                                  |
| **Rate Limiting (Threat)**     | `ThreatIntelController`        | **VERIFIED** (Code Audit) | Feeds: 30/min                                          |
| **DNS Rebinding Guard (IPC)**  | Desktop Agent `main.rs`        | **VERIFIED** (Rust Test)  | Validates Host, Origin, and Referer headers            |
| **CI Permissions**             | `.github/workflows/ci.yml`     | **VERIFIED** (Code Audit) | Least privilege: `permissions: contents: read`         |

---

## 16. Comprehensive Testing & Verification Status

### 16.1 Test Suite Inventory

```
Sentinel Monorepo Test Footprint
├── apps/backend/test/
│   ├── health.controller.spec.ts                   [PASS]
│   ├── health.e2e-spec.ts                          [PASS]
│   ├── scans-evidence.spec.ts                      [PASS]
│   ├── security-engine.spec.ts                     [PASS]
│   ├── ai/
│   │   ├── ai.controller.spec.ts                   [PASS]
│   │   ├── ai.service.spec.ts                      [PASS]
│   │   ├── output-validator.spec.ts                [PASS]
│   │   └── gemini.integration.spec.ts              [PASS - Live API]
│   ├── security/
│   │   └── security-hardening.spec.ts              [PASS - 14 Regression Tests]
│   └── threat-intel/
│       ├── ai-threat-intel.spec.ts                 [PASS]
│       ├── cache-ratelimit.spec.ts                 [PASS]
│       ├── cve-intel.spec.ts                       [PASS]
│       ├── failure-isolation.spec.ts               [PASS]
│       ├── score-invariance.spec.ts                [PASS]
│       ├── threat-intel-abstraction.spec.ts        [PASS]
│       ├── threat-intel.controller.spec.ts         [PASS]
│       └── url-domain-intel.spec.ts                [PASS]
│
├── apps/mobile/test/
│   ├── app.spec.ts                                 [PASS]
│   ├── components.spec.tsx                         [PASS]
│   ├── design-system.spec.ts                       [PASS]
│   ├── device-scanner.spec.ts                      [PASS]
│   ├── responsive.spec.ts                          [PASS]
│   ├── screens.spec.tsx                            [PASS]
│   ├── security-engine-integration.spec.ts         [PASS]
│   ├── states.spec.tsx                             [PASS]
│   └── threat-intel-card.spec.tsx                  [PASS]
│   (9 test suites, 40 unit tests passed)
│
└── apps/desktop/ (Rust Cargo Tests)
    ├── test_ipc_authorized_local_request           [PASS]
    ├── test_ipc_rejects_cross_origin_browser_req   [PASS]
    ├── test_ipc_rejects_dns_rebinding_host         [PASS]
    ├── test_ipc_rejects_external_referer           [PASS]
    ├── test_session_persistence_and_clearing       [PASS]
    └── test_identity_persistence_and_reuse         [PASS]
    (6 native unit tests passed)
```

### 16.2 Build Verification

- Monorepo build verified via `pnpm build`:
  - `@sentinel/types`: TypeScript build successful.
  - `@sentinel/backend`: NestJS build successful.
  - `@sentinel/desktop`: Cargo release build successful.
  - `@sentinel/mobile`: Compilation scripts verified.

---

## 17. Infrastructure, Docker & CI/CD Pipeline

### 17.1 Docker Infrastructure (`docker-compose.yml`)

- **PostgreSQL Service:**
  - Image: `postgres:16-alpine`.
  - Ports: `5433:5432`.
  - Persistence: `sentinel_pgdata` volume.
  - Environment: `POSTGRES_USER=sentinel`, `POSTGRES_PASSWORD=sentinel_dev`, `POSTGRES_DB=sentinel`.
- **Redis Service:**
  - Image: `redis:7-alpine`.
  - Ports: `6379:6379`.
  - Memory Management: Max memory `64mb`, policy `allkeys-lru`.
  - Persistence: `sentinel_redis` volume.

### 17.2 CI/CD Pipeline (`.github/workflows/ci.yml`)

- **Triggers:** Push to `main`, Pull Requests targeting `main`.
- **Security Context:** Least privilege enforced (`permissions: contents: read`).
- **Runner:** `ubuntu-latest` with Node.js 22.
- **Steps:** Checkout, setup pnpm (`v4`), setup Node with pnpm cache, `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm test`.

---

## 18. Privacy, Data Governance & Sanitization Boundaries

### 18.1 Data Sanitization Filter (`AiService.sanitizeText` & `sanitizeEvidence`)

Before any telemetry or user-submitted text reaches the Gemini LLM, it passes through regex sanitization filters:

- **Email Addresses:** Redacted to `[REDACTED_EMAIL]`.
- **IPv4 Addresses:** Redacted to `[REDACTED_IP]`.
- **Bearer & JWT Tokens:** Redacted to `[REDACTED_TOKEN]`.
- **API Keys:** Redacted to `[REDACTED_API_KEY]`.
- **Credit Cards:** Redacted to `[REDACTED_CC]`.
- **Hardware GUIDs & S/N:** Redacted to prevent device fingerprinting in cloud logs.

### 18.2 Screenshot Vision Privacy

- Screenshots submitted to `POST /api/v1/ai/screenshot` are analyzed purely in transient RAM.
- **Zero Disk / Zero Database Persistence:** Images are never saved to disk, object storage, or PostgreSQL. Once the structured analysis is emitted, the base64 buffer is discarded.

---

## 19. Logging, Telemetry & Failure Mode Handling

### 19.1 Logging Architecture

- Built on NestJS standard `Logger` with structured operation context.
- **Secret Redaction in Logs:** Sensitive variables, connection strings, passwords, and JWT payloads are filtered via `AllExceptionsFilter`.
- **Production Safety:** In production (`NODE_ENV === 'production'`), uncaught 500 errors omit stack traces and internal database errors, returning generic `"Internal server error"`.

### 19.2 Graceful Degradation Matrix

| Failure Scenario              | Subsystem Impact      | Behavior / Fallback                                                                          |
| :---------------------------- | :-------------------- | :------------------------------------------------------------------------------------------- |
| **Gemini API Down / 503**     | AI Advisory endpoints | Returns `503 Service Unavailable` with retry backoff; deterministic scan score is unaffected |
| **Gemini Rate Limit (429)**   | AI Advisory endpoints | Exponential backoff (up to 4 retries) adhering to `retry in Xs` header                       |
| **Threat Feed Timeout (>5s)** | Threat Intelligence   | Circuit breaker logs warning, returns `verdict: "UNAVAILABLE"`                               |
| **Redis Cache Down**          | Threat Intel & Queue  | System falls back to direct provider queries without crashing backend                        |
| **PostgreSQL Down**           | Core APIs             | Health controller emits `status: "unhealthy"`; APIs reject with 500                          |
| **Missing Windows Perms**     | Desktop Agent         | Checks report `trustState: "PERMISSION_REQUIRED"`; score is unpenalized                      |
| **Missing Android Perms**     | Mobile App            | Emits `trustState: "PERMISSION_REQUIRED"`; score is unpenalized                              |

---

## 20. Complete Dependency Inventory

### 20.1 Root Workspace

- `turbo`: `^2.5.4` (Build system)
- `prettier`: `^3.5.3` (Formatting)
- `typescript`: `^5.8.3` (Type checking)

### 20.2 Backend (`@sentinel/backend`)

- `@fastify/cors`: `^11.3.0`
- `@fastify/helmet`: `^13.1.1`
- `@nestjs/common`, `@nestjs/core`: `^11.1.3`
- `@nestjs/jwt`: `^10.2.0`
- `@nestjs/passport`: `^10.0.3`
- `@nestjs/platform-fastify`: `^11.1.3`
- `@nestjs/swagger`: `^11.2.0`
- `@nestjs/throttler`: `^6.5.0`
- `@prisma/client`: `^6.19.3`
- `bcrypt`: `^6.0.0`
- `bullmq`: `^6.3.4`
- `class-validator`, `class-transformer`: `^0.15.1`, `^0.5.1`
- `fastify`: `^5.12.1` (Security override enforced in workspace)
- `ioredis`: `^6.0.0`
- `passport`, `passport-jwt`: `^0.7.0`, `^4.0.1`

### 20.3 Desktop Agent (`apps/desktop/Cargo.toml`)

- `serde`, `serde_json`: `1.0` (Serialization)
- `tokio`: `1` (Async runtime)
- `reqwest`: `0.12` (HTTPS client)
- `winreg`: `0.52` (Windows registry access)
- `uuid`: `1.10` (UUID generation)
- `chrono`: `0.4` (Timestamps)
- `sha2`, `hex`: `0.10`, `0.4` (Hashing)

### 20.4 Security Overrides (`pnpm-workspace.yaml`)

- `fastify`: `^5.12.1` (Patches known HTTP framework advisories)
- `postcss`: `>=8.5.23` (Patches frontend parser vulnerability)
- `decode-uri-component`: `>=0.5.0` (Patches URI parsing advisory)

---

## 21. Phases 1–9 Verification & Milestone Audit Table

| Phase        | Title                 | Commit    | Date        | Status            | Major Deliverables                                                     | Verification Evidence                    |
| :----------- | :-------------------- | :-------- | :---------- | :---------------- | :--------------------------------------------------------------------- | :--------------------------------------- |
| **Phase 1**  | Foundation            | `12d5cb0` | Sep 2, 2026 | **VERIFIED PASS** | Monorepo init, pnpm workspace, Turborepo, shared types package         | Workspace build clean, types compile     |
| **Phase 2**  | UI/UX Foundation      | `125c889` | Sep 2, 2026 | **VERIFIED PASS** | React Native Expo scaffolding, design system tokens, Cyberpunk theme   | 9 mobile test suites pass                |
| **Phase 3**  | Backend Foundation    | `28052a8` | Sep 3, 2026 | **VERIFIED PASS** | NestJS + Fastify setup, PostgreSQL Prisma schema, JWT auth, Docker     | Auth tests pass, Fastify runs            |
| **Phase 4**  | Device Intelligence   | `b7c4011` | Sep 3, 2026 | **VERIFIED PASS** | Android Kotlin module, iOS Swift module, Data Trust Model (provenance) | Native module builds, scanner tests pass |
| **Phase 5**  | Security Engine       | `1882ee9` | Sep 3, 2026 | **VERIFIED PASS** | Deterministic rule engine, mathematical scoring, risk calculator       | `security-engine.spec.ts` pass           |
| **Phase 6**  | Windows Desktop Agent | `4daabd7` | Sep 4, 2026 | **VERIFIED PASS** | Rust Tokio binary, WMI/Registry telemetry, loopback UI & IPC           | `cargo test` passes (6 unit tests)       |
| **Phase 7**  | AI Intelligence       | `35d9b47` | Sep 4, 2026 | **VERIFIED PASS** | Gemini provider abstraction, prompt registry, output validation        | AI service & controller specs pass       |
| **Phase 7b** | Gemini Integration    | `ba43573` | Sep 4, 2026 | **VERIFIED PASS** | Live Gemini integration verification, retry logic, timeout caps        | Live integration test verified           |
| **Phase 8**  | Threat Intelligence   | `bb88d0b` | Sep 4, 2026 | **VERIFIED PASS** | 5 Providers (CISA, OSV, URLhaus, OpenPhish, Exposure), SSRF guard      | 8 threat intel test suites pass          |
| **Phase 9**  | Security Hardening    | `5394f98` | Sep 4, 2026 | **VERIFIED PASS** | Bcrypt 12 + timing guard, BOLA checks, secret sanitization, IPC guard  | `security-hardening.spec.ts` pass        |

---

## 22. Git Version Control & Repository Integrity

- **Active Branch:** `main`.
- **Latest Commit Hash:** `5394f98`.
- **Latest Commit Message:** `feat: harden sentinel security`.
- **Author:** Sentinel Agent.
- **Commit Date:** Friday, September 4, 2026 22:37:59 +07:00.
- **Working Tree:** Clean (verified via `git status`).
- **Secret Tracking Audit:** Zero secrets are tracked by Git. All `.env` files are verified against `.gitignore`.

---

## 23. Known Limitations & Residual Risks Matrix

The following items are documented factually as technical characteristics of the current implementation. They are explicitly preserved without modification:

| #       | Limitation / Risk                             | Severity        | Affected Subsystem   | Description & Root Cause                                                                                                                        | Recommended Future Phase Action                                                                |
| :------ | :-------------------------------------------- | :-------------- | :------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------- |
| **R-1** | **DNS Rebinding / TOCTOU in Threat Intel**    | Low/Medium      | Backend Threat Intel | `ThreatIntelValidator` validates hostnames via static regex before HTTP requests, but does not pin socket IPs at connection time.               | Phase 10 / Production hardening: Implement socket IP pinning via custom HTTP agent.            |
| **R-2** | **Windows Multi-User IPC Loopback Risk**      | Low             | Desktop Agent        | The Rust agent binds to `127.0.0.1:8765`. Another local user account on the same OS could connect directly, though browser origins are blocked. | Phase 10: Add per-session local secret handshake token in `%APPDATA%`.                         |
| **R-3** | **iOS Platform Sandbox Constraints**          | Low (By Design) | Mobile App (iOS)     | iOS sandboxing prevents listing installed applications or inspecting system screen lock state (`NOT_AVAILABLE`).                                | Preserved by design under Sentinel Data Trust Model (honest reporting).                        |
| **R-4** | **Android 11+ Package Visibility Filter**     | Low (By Design) | Mobile App (Android) | Android 11+ restricts package enumeration without `QUERY_ALL_PACKAGES`. Apps return `partially_discoverable`.                                   | Preserved for Google Play policy compliance.                                                   |
| **R-5** | **Prisma Migration History Consolidation**    | Low             | Database / Prisma    | `prisma/migrations` contains only `init`. Phase 5 model additions (`SecurityHistory`) were pushed via dev sync.                                 | Phase 10 / Pre-deployment: Run `prisma migrate dev` to produce authoritative migration 2.      |
| **R-6** | **Absence of Refresh Token Rotation**         | Medium          | Authentication       | JWT authentication utilizes long-lived (7-day) access tokens with no refresh token rotation or revocation table.                                | Phase 10: Implement short-lived access tokens (15m) + rotating refresh token table.            |
| **R-7** | **Single-User / Lack of RBAC**                | Low             | Authentication / DB  | Database schema has no `Role` enum or multi-tenancy controls. Built for single personal account ownership.                                      | Post-Phase 10: Multi-tenant / enterprise RBAC if commercialized.                               |
| **R-8** | **CI Workflow Excludes Rust & Mobile Native** | Low             | CI/CD                | `.github/workflows/ci.yml` builds and tests only the Node.js monorepo; Rust (`cargo test`) is not in CI.                                        | Phase 10: Add Rust and Android Gradle matrix steps to CI workflow.                             |
| **R-9** | **Gemini Live Rate-Limit Vulnerability**      | Low             | Testing / AI         | `gemini.integration.spec.ts` hits live Google API and can experience rate-limit (429) backoff during rapid test runs.                           | Keep unit tests running against `MockAiProvider`; isolate integration tests to scheduled runs. |

---

## 24. Pre-Phase-10 Readiness Assessment

| Area                            | Status                     | Technical Justification                                                                   |
| :------------------------------ | :------------------------- | :---------------------------------------------------------------------------------------- |
| **Code Completeness**           | **READY**                  | All Phases 1–9 features are fully implemented across backend, mobile, desktop, and types. |
| **Documentation Completeness**  | **READY**                  | Comprehensive single source of truth established in this document.                        |
| **Environment Readiness**       | **READY**                  | Docker containers (Postgres, Redis) configured; Node.js, pnpm, and Rust build cleanly.    |
| **Authentication Readiness**    | **READY WITH LIMITATIONS** | Secure Bcrypt 12 + JWT operational; lacks refresh token rotation (deferred to Phase 10).  |
| **Database Readiness**          | **READY WITH LIMITATIONS** | PostgreSQL 16 schema operational; needs migration consolidation before prod release.      |
| **Mobile Readiness**            | **READY**                  | React Native Expo application compiles and passes 40 unit tests.                          |
| **Windows Desktop Readiness**   | **READY**                  | Rust agent compiles, executes inspection, and passes 6 unit tests.                        |
| **AI Intelligence Readiness**   | **READY**                  | Gemini provider integrated, tested, and guarded by immutable score boundaries.            |
| **Threat Intel Readiness**      | **READY**                  | 5 zero-credential providers operational with Redis caching and SSRF guards.               |
| **Testing Readiness**           | **READY**                  | Comprehensive test suites present across all packages; high test pass rate.               |
| **Security Readiness**          | **READY**                  | Hardening baseline verified (Bcrypt timing guard, BOLA, SSRF, secret masking).            |
| **Productionization Readiness** | **READY FOR PHASE 10**     | System is stabilized and primed for Phase 10 (System Integration & Verification).         |

---

## 25. Master Consolidated Inventory Checklist

- [x] **Project Identity Verified:** Sentinel — Personal Cybersecurity Intelligence
- [x] **Monorepo Verified:** Turborepo `^2.5.4`, pnpm `11.25.0`, Node.js `22.x`
- [x] **Git State Verified:** Branch `main`, commit `5394f98`, clean working tree
- [x] **Phases 1–9 Verified:** All 9 phases completed, tested, and historically mapped
- [x] **Complete Tech Stack Documented:** Backend, Mobile, Desktop, Database, AI, Threat Intel
- [x] **Database Schema Documented:** 8 Prisma models, 8 enums, foreign keys, cascades, indexes
- [x] **API Inventory Documented:** Exactly 37 backend endpoints + 5 desktop IPC routes
- [x] **Authentication Audited:** Bcrypt 12, timing attack dummy hash, JWT 7d, BOLA guards
- [x] **Environment Variables Cataloged:** All 17 variables mapped with secret masking
- [x] **AI & Gemini Audited:** Gemini 3.6/1.5 Flash, strict JSON schemas, score immutability
- [x] **Threat Intelligence Cataloged:** CISA KEV, OSV, URLhaus, OpenPhish, Exposure Provider
- [x] **Desktop Agent Documented:** Rust Tokio loopback IPC server, WMI/Registry telemetry
- [x] **Mobile App Documented:** React Native Expo, 5 navigation tabs, Cyberpunk theme
- [x] **Security Hardening Audited:** SSRF protection, secret redaction, rate limits, IPC guards
- [x] **Testing Status Documented:** Backend Jest suites, Mobile Jest tests, Rust Cargo tests
- [x] **Known Limitations Documented:** 9 verified technical limitations and residual risks
- [x] **Pre-Phase-10 Readiness Assessed:** Authoritative baseline established for Phase 10 kickoff
- [x] **Absolute File Modification Lock Upheld:** Baseline verified for Phase 10 kickoff

---

## 26. Phase 10.2 Product Completion & Remediation Summary

| Defect / Backlog Item | Area                  | Resolution Summary                                                                                                                                                  | Final Verification            |
| :-------------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------- |
| **Defect 01**         | Mobile / Web UI       | Extracted `statusLabel` outside SVG circular ring into dedicated semantic status pill below gauge in `ScoreGauge.tsx`. Eliminates text collision.                   | Verified on Android & Web     |
| **Defect 02**         | Mobile / Web UI       | Created `EvidenceProvenanceCard.tsx` implementing a 7-layer human-friendly hierarchy (zero raw JSON dumps, clear provenance and boundaries).                        | Verified on Android & Web     |
| **Defect 03**         | Mobile / Web UI       | Constrained category selector pills (`height: 36`, `height: 44` container) in `protect.tsx` preventing vertical stretching on Web. Added category summary card.     | Verified on Android & Web     |
| **Defect 04**         | Mobile / Web UX       | Replaced text input in Screenshot Analyzer with multimodal image dropzone, validation (<=5MB), preview card, and direct connection to `POST /api/v1/ai/screenshot`. | Verified on Android & Web     |
| **Defect 05**         | Mobile Data           | Cleansed mock devices in `securityData.ts` to strictly contain only `Google Pixel 8 Pro`. Added dynamic device API fetching in `profile.tsx`.                       | Verified on Android & Web     |
| **Defect 06**         | Mobile / Web Settings | Implemented `preferencesStore.ts` for non-sensitive preference persistence. Activated interactive modal dialogs for all 4 settings in `profile.tsx`.                | Verified on Android & Web     |
| **DEF-01**            | Security Engine       | Updated `engine.ts` and `recommendations.ts` to pass and use `evaluationDate` for deterministic recommendation creation timestamps.                                 | 130 Backend Tests Passed      |
| **DEF-02**            | Backend Redis         | Implemented bounded exponential reconnect backoff in `redis.module.ts` and `queue.module.ts`.                                                                       | 130 Backend Tests Passed      |
| **DEF-03**            | Monorepo Hygiene      | Formatted entire codebase with Prettier; verified zero drift.                                                                                                       | `pnpm format:check` Passed    |
| **DEF-04**            | Dependencies          | Audited 4 dev-tooling advisories (`image-size`, `deepmerge-ts`, `uuid`); confirmed zero runtime exposure.                                                           | Audit Documented              |
| **DEF-05**            | Accessibility         | Enhanced `FindingCard`, `RecommendationCard`, `CategoryCard`, and `SettingRow` with `accessibilityRole` and descriptive labels.                                     | 48 Mobile Tests Passed        |
| **DEF-06**            | Infrastructure        | Updated `docker-compose.yml` and live Redis container with `--maxmemory-policy noeviction` for BullMQ queue stability.                                              | Live Redis Verified           |
| **DEF-07**            | Database              | Consolidated schema migration `20260905141000_consolidate_schema` in Prisma.                                                                                        | `prisma migrate status` Clean |

========================================================================================
END OF AUTHORITATIVE MASTER DOCUMENTATION — SENTINEL PHASE 10.2 COMPLETED
========================================================================================
