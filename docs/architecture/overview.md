# Architecture Overview

> **Authoritative specification**: [SENTINEL_PRD_v1.0.md](../../SENTINEL_PRD_v1.0.md)

## High-Level Architecture

```
Mobile (React Native + Expo)
    ↕
Sentinel API (NestJS + Fastify)
    ↕
PostgreSQL + Redis + BullMQ
    ↕
Security Engine → Risk Engine → AI Layer (Gemini)
    ↕
Desktop Agent (Tauri + Rust) — future phase
```

## Monorepo Structure

The project uses **pnpm workspaces** with **Turborepo** for build orchestration.

### Current (Phase 1)

| Package          | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `apps/backend`   | NestJS API with Fastify adapter           |
| `apps/mobile`    | React Native + Expo mobile application    |
| `packages/types` | Shared TypeScript types and API contracts |

### Future Phases

Additional packages will be added as implementation progresses through the PRD phases:

- `services/` — security engine, AI engine, workers
- `packages/config`, `packages/security-rules`, `packages/ui`
- `native/` — Android (Kotlin), iOS (Swift), Desktop (Rust)
- `apps/desktop` — Tauri desktop application
- `infrastructure/` — Docker, deployment

## API Architecture

- **Protocol**: REST (WebSocket foundation planned)
- **Versioning**: URI-based (`/api/v1/...`)
- **Documentation**: OpenAPI/Swagger at `/api/docs`
- **Adapter**: Fastify (performance-oriented)

## Data Flow (Target)

```
Device Data → Evidence → Security Rules → Risk Engine → Score → AI Explanation
```

AI is an explanation layer. Core security scoring is deterministic and rule-based.
