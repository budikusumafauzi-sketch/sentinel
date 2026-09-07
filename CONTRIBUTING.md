# Contributing to Sentinel

Thank you for your interest in contributing to **Sentinel**!

Sentinel is a personal cybersecurity intelligence platform built on transparent, evidence-based security diagnostics, deterministic risk evaluation, and privacy-preserving AI advisory. To maintain the highest standards of security, determinism, and engineering rigor, all contributions must adhere to the guidelines outlined in this document.

---

## 📜 Code of Conduct

All contributors and maintainers are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating in our issues, discussions, or pull requests.

---

## 🏛️ Foundational Architectural Invariants

Before writing code, understand Sentinel's core architectural tenets:

1. **Deterministic Supremacy:**  
   The device security score ($0-100$) is computed strictly through mathematical algorithms located in `packages/types/src/security-engine/`. **No AI or external LLM service may ever alter, bias, or calculate security scores.** AI is exclusively an explanation, advisory, and suspicious media analysis layer.
2. **Honest Posture & Provenance:**  
   Every device signal collected must carry an explicit provenance status (`VERIFIED`, `ANALYZED`, `USER_PROVIDED`, `NOT_AVAILABLE`, `PERMISSION_REQUIRED`, or `UNABLE_TO_VERIFY`). Missing telemetry is never treated as a positive or negative finding; unverified signals are never represented as secure.
3. **Defense in Depth & Zero Secrets:**  
   Never commit secrets, tokens, keys, or internal connection strings. All external inputs must be validated using `class-validator` DTOs. Database queries must be strictly parameterized through Prisma. Threat intelligence queries must respect SSRF filters.
4. **BOLA / IDOR Verification:**  
   All entity queries must verify that the requesting user owns the target resource (devices, scans, findings, recommendations).

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** `>= 22.0.0`
- **pnpm** `11.25.0` (`corepack enable` or `npm install -g pnpm@11.25.0`)
- **Rust** `1.75+` (for `apps/desktop` native Windows agent)
- **Docker & Docker Compose** (for local PostgreSQL 16 and Redis 7)
- **Android Studio & SDK 34+** (for `apps/mobile` native Android development)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/budikusumafauzi-sketch/sentinel.git
cd sentinel

# 2. Install dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# 3. Configure environment files
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env

# 4. Start local infrastructure
docker compose up -d

# 5. Run Prisma migrations
pnpm --filter @sentinel/backend prisma migrate dev

# 6. Build all workspace packages
pnpm build
```

---

## 💻 Workflow & Monorepo Commands

Sentinel uses **Turborepo** to orchestrate tasks across workspaces:

```bash
# Start all services in development mode
pnpm dev

# Run individual workspaces
pnpm --filter @sentinel/backend dev   # NestJS/Fastify API server
pnpm --filter @sentinel/mobile dev    # Expo / React Native Web
pnpm --filter @sentinel/mobile android # Android Native
cargo run --manifest-path apps/desktop/Cargo.toml # Windows Rust Agent

# Quality checks
pnpm lint         # Run ESLint across all packages
pnpm test         # Run all Jest & Rust unit test suites
pnpm format       # Format code with Prettier
pnpm format:check # Verify formatting without modifying files
```

---

## 🌿 Git Branching & Commit Conventions

### Branch Naming

- `feat/<feature-name>` — New capabilities or enhancements
- `fix/<bug-description>` — Bug fixes
- `security/<issue>` — Security hardening or fixes
- `docs/<topic>` — Documentation improvements
- `refactor/<scope>` — Code refactoring without behavior change

### Commit Message Guidelines

We adhere to [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative description>

[optional body explaining context and rationale]

[optional footer(s), e.g., Closes #123]
```

**Permitted Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `security`.  
**Examples:**

- `feat(threat-intel): add rate limiting exponential backoff`
- `fix(mobile): resolve ScoreGauge status label text wrapping`
- `security(backend): enforce SSRF IP denylist on URLhaus lookups`

---

## 🧪 Testing Requirements

Any pull request introducing logic changes must include accompanying tests:

1. **Backend:** Jest unit tests in `apps/backend/test/` or alongside services (`*.spec.ts`).
2. **Mobile:** React Native Jest tests in `apps/mobile/test/`.
3. **Desktop:** Rust unit tests via `cargo test`.
4. **Security Engine:** Pure mathematical rules must maintain 100% test coverage in `@sentinel/types`.

All existing tests must pass before submitting a pull request:

```bash
pnpm test
```

---

## 📋 Pull Request Checklist

Before opening a pull request, ensure:

- [ ] All unit and regression tests pass (`pnpm test`).
- [ ] Code passes all lint checks (`pnpm lint`).
- [ ] Code formatting complies with Prettier (`pnpm format:check`).
- [ ] No secrets, `.env` files, or test credentials are committed.
- [ ] Scoring determinism is preserved; AI is not used for numerical scoring.
- [ ] Relevant documentation under `docs/` has been updated if architecture or APIs changed.
- [ ] Commit history is clean, readable, and follows Conventional Commits.

Thank you for your dedication to building trustworthy, transparent cybersecurity intelligence!
