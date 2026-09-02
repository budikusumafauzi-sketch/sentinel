# Sentinel

**Personal Cybersecurity Intelligence**

Sentinel is a personal cybersecurity intelligence platform that automatically discovers available security information from a user's devices, evaluates security posture using evidence-based rules, communicates platform limitations honestly, identifies meaningful risks, explains why they matter, and guides users toward practical security improvements.

> See [SENTINEL_PRD_v1.0.md](./SENTINEL_PRD_v1.0.md) for the full product specification.

## Repository Structure

```
sentinel/
├── apps/
│   ├── backend/     # NestJS + Fastify API
│   └── mobile/      # React Native + Expo mobile app
├── packages/
│   └── types/       # Shared TypeScript types and contracts
├── docs/
│   ├── architecture/
│   ├── development/
│   ├── security/
│   ├── api/
│   └── design/
└── .github/
    └── workflows/   # CI/CD
```

## Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 11
- **Android Studio** (for mobile development)
- **Git**

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run backend (development)
pnpm --filter @sentinel/backend dev

# Run mobile (development)
pnpm --filter @sentinel/mobile dev

# Run all linting
pnpm lint

# Run all tests
pnpm test

# Format all files
pnpm format
```

## Development

See [docs/development/getting-started.md](./docs/development/getting-started.md) for detailed setup instructions.

## Architecture

See [docs/architecture/overview.md](./docs/architecture/overview.md) for the architecture overview.

## Technology Stack

| Layer       | Technology                       |
| ----------- | -------------------------------- |
| Mobile      | React Native + Expo + TypeScript |
| Navigation  | Expo Router                      |
| Backend     | NestJS + Fastify                 |
| Database    | PostgreSQL + Prisma              |
| Cache/Queue | Redis + BullMQ                   |
| Monorepo    | pnpm + Turborepo                 |
| CI/CD       | GitHub Actions                   |
| Testing     | Jest, Supertest                  |

## Security

This project follows security-first development principles. See [docs/security/conventions.md](./docs/security/conventions.md).

- No secrets in source code
- Environment variables for all configuration
- `.gitignore` covers sensitive files
- OWASP MASVS/MASTG as security reference

## License

Private — All rights reserved.
