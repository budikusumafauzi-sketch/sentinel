# Getting Started

## Prerequisites

| Tool           | Minimum Version | Purpose            |
| -------------- | --------------- | ------------------ |
| Node.js        | 22+             | Runtime            |
| pnpm           | 11+             | Package manager    |
| Git            | 2.x             | Version control    |
| Android Studio | Latest          | Mobile development |
| JDK            | 17+             | Android builds     |

## Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd sentinel
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env
   ```

   Edit `.env` files with your local configuration. Never commit real secrets.

4. **Build all packages**
   ```bash
   pnpm build
   ```

## Running the Backend

```bash
# Development mode (with watch)
pnpm --filter @sentinel/backend dev

# The API starts at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
# Health check at http://localhost:3000/api/v1/health
```

## Running the Mobile App

```bash
# Start Expo dev server
pnpm --filter @sentinel/mobile dev

# Run on Android
pnpm --filter @sentinel/mobile android
```

Ensure an Android emulator is running or a device is connected via ADB.

## Common Commands

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm build`        | Build all packages                 |
| `pnpm lint`         | Run linting across all packages    |
| `pnpm test`         | Run tests across all packages      |
| `pnpm format`       | Format all files with Prettier     |
| `pnpm format:check` | Check formatting without modifying |

## Project Structure

See the [Architecture Overview](../architecture/overview.md) for detailed structure documentation.
