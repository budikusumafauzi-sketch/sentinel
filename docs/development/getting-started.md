# Getting Started with Sentinel

This guide walks through setting up your local environment for Sentinel development across the backend, mobile, and native Windows desktop agent workspaces.

---

## Prerequisites

| Tool                         | Minimum Version          | Required For                                             |
| :--------------------------- | :----------------------- | :------------------------------------------------------- |
| **Node.js**                  | `>= 22.0.0`              | Backend API, tooling, and mobile Metro bundler           |
| **pnpm**                     | `11.25.0`                | Workspace package management (`npm i -g pnpm@11.25.0`)   |
| **Git**                      | `2.x`                    | Source control                                           |
| **Docker & Docker Compose**  | Latest                   | Local PostgreSQL 16 and Redis 7 services                 |
| **Rust & Cargo**             | `Edition 2021` (`1.75+`) | Windows Desktop Agent (`apps/desktop`)                   |
| **Android Studio & SDK 34+** | API 34+ (JDK 17)         | Native Android mobile app builds (optional for Web mode) |

---

## Step-by-Step Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/budikusumafauzi-sketch/sentinel.git
cd sentinel
```

### 2. Install Dependencies

Install frozen dependencies across the Turborepo monorepo:

```bash
pnpm install --frozen-lockfile
```

### 3. Configure Environment Variables

Create your local `.env` files from the provided templates:

```bash
# Root environment file
cp .env.example .env

# Backend environment file
cp apps/backend/.env.example apps/backend/.env
```

> [!TIP]
> The default values in `apps/backend/.env.example` are pre-configured to match the local Docker infrastructure defined in `docker-compose.yml`.

### 4. Launch Local Infrastructure

Start PostgreSQL 16 (port `5433`) and Redis 7 (port `6379`):

```bash
docker compose up -d
```

Verify containers are running:

```bash
docker compose ps
```

### 5. Run Database Migrations

Apply Prisma SQL migrations to your local PostgreSQL instance:

```bash
pnpm --filter @sentinel/backend prisma migrate dev
```

### 6. Build Monorepo Packages

Compile TypeScript contracts, backend build artifacts, and desktop binaries:

```bash
pnpm build
```

---

## Running Applications

### Backend API (`apps/backend`)

```bash
pnpm --filter @sentinel/backend dev
```

- **API Server:** `http://localhost:3000`
- **OpenAPI / Swagger UI:** `http://localhost:3000/api/docs`
- **Health Check:** `http://localhost:3000/api/v1/health`

### Mobile Client (`apps/mobile`)

#### Web Mode (Fast Browser Development)

```bash
pnpm --filter @sentinel/mobile dev
```

Press `w` in the terminal to open the application in your default web browser via Expo Web / Metro.

#### Native Android (Emulator or Connected Device)

```bash
# Ensure an Android emulator is running (e.g., Pixel 8a API 34) or a device is connected via ADB:
adb devices

# Launch Android development build:
pnpm --filter @sentinel/mobile android
```

### Windows Desktop Agent (`apps/desktop`)

The Windows Desktop Agent is a standalone Rust binary that communicates with the Sentinel backend and serves a local UI over loopback:

```bash
# Run in development mode
cargo run --manifest-path apps/desktop/Cargo.toml

# The desktop agent serves its embedded UI at http://127.0.0.1:8765
```

---

## Common Development Commands

| Command             | Description                                              |
| :------------------ | :------------------------------------------------------- |
| `pnpm build`        | Compile all workspaces through Turborepo pipeline        |
| `pnpm dev`          | Run all workspace dev servers concurrently               |
| `pnpm lint`         | Execute ESLint across all TypeScript packages            |
| `pnpm test`         | Run all automated test suites (Backend, Mobile, Desktop) |
| `pnpm format`       | Auto-format all code files using Prettier                |
| `pnpm format:check` | Verify formatting without making changes                 |
| `pnpm clean`        | Clean all build artifacts, `.turbo`, and caches          |

---

## Next Steps

- **Architecture Deep Dive:** Read [Architecture Overview](../architecture/overview.md) and [docs/SENTINEL_PROJECT_MASTER_DOCUMENTATION.md](../SENTINEL_PROJECT_MASTER_DOCUMENTATION.md).
- **Testing Guidelines:** Refer to the [Testing Guide](testing.md).
- **Security Principles:** Review the [Security Conventions](../security/conventions.md).
