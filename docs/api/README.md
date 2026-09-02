# API Documentation

## Overview

The Sentinel API is built with NestJS and the Fastify adapter.

- **Base URL**: `http://localhost:3000/api/v1`
- **Interactive docs**: `http://localhost:3000/api/docs` (Swagger UI)
- **Versioning**: URI-based (`/api/v1/...`)

## Current Endpoints

### Health

| Method | Path             | Description          |
| ------ | ---------------- | -------------------- |
| `GET`  | `/api/v1/health` | Service health check |

#### Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "0.1.0",
    "uptime": 42
  },
  "timestamp": "2026-09-02T14:00:00.000Z"
}
```

## Future Endpoints

Additional API endpoints will be added in Phase 3 (Backend + Database) and subsequent phases as defined in the PRD.
