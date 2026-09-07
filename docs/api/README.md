# Sentinel REST API Specification

> **Base URL**: `http://localhost:3000/api/v1`  
> **Interactive OpenAPI / Swagger Documentation**: `http://localhost:3000/api/docs`  
> **Adapter Engine**: NestJS 11 + Fastify 5

---

## Overview

The Sentinel API provides an enterprise-grade RESTful interface for device registration, telemetry ingestion, scan orchestration, threat intelligence correlation, and constrained AI advisory.

### Core Headers & Conventions

- **Authentication**: `Authorization: Bearer <jwt-token>` (stateless HMAC-SHA256 JWT)
- **Content-Type**: `application/json`
- **Response Envelope**: Standard envelope across all endpoints:
  ```json
  {
    "success": true,
    "data": { ... },
    "timestamp": "2026-09-07T12:00:00.000Z"
  }
  ```
- **Payload Cap**: 10MB maximum request size enforced by Fastify gateway.
- **Rate Limiting**: Global throttling at 100 requests per minute with stricter route-level limits on AI and threat intelligence endpoints.

---

## API Controller Modules

### 1. Authentication (`/api/v1/auth`)

| Method | Endpoint                | Access | Description                                               |
| :----- | :---------------------- | :----- | :-------------------------------------------------------- |
| `POST` | `/api/v1/auth/register` | Public | Register a new user account (12-round bcrypt hash)        |
| `POST` | `/api/v1/auth/login`    | Public | Authenticate user credentials and return JWT bearer token |
| `GET`  | `/api/v1/auth/profile`  | Bearer | Retrieve authenticated user profile and account details   |

### 2. Device Management (`/api/v1/devices`)

| Method   | Endpoint              | Access | Description                                                          |
| :------- | :-------------------- | :----- | :------------------------------------------------------------------- |
| `POST`   | `/api/v1/devices`     | Bearer | Register a new device (Mobile, Desktop, Tablet)                      |
| `GET`    | `/api/v1/devices`     | Bearer | List all devices owned by authenticated user                         |
| `GET`    | `/api/v1/devices/:id` | Bearer | Retrieve specific device details and posture summary (BOLA verified) |
| `PATCH`  | `/api/v1/devices/:id` | Bearer | Update device metadata, nickname, or attributes                      |
| `DELETE` | `/api/v1/devices/:id` | Bearer | Deactivate or unbind a device from account                           |

### 3. Scan & Evidence Ingestion (`/api/v1/scans`)

| Method | Endpoint                         | Access | Description                                             |
| :----- | :------------------------------- | :----- | :------------------------------------------------------ |
| `POST` | `/api/v1/scans`                  | Bearer | Initiate a new security scan for a specified device     |
| `POST` | `/api/v1/scans/:id/telemetry`    | Bearer | Ingest normalized device telemetry and evidence signals |
| `GET`  | `/api/v1/scans/:id`              | Bearer | Retrieve scan results, mathematical score, and findings |
| `GET`  | `/api/v1/scans/device/:deviceId` | Bearer | Retrieve historical scan trajectory for a device        |

### 4. Findings & Posture (`/api/v1/findings`)

| Method  | Endpoint                      | Access | Description                                                  |
| :------ | :---------------------------- | :----- | :----------------------------------------------------------- |
| `GET`   | `/api/v1/findings`            | Bearer | List active security findings across user devices            |
| `GET`   | `/api/v1/findings/:id`        | Bearer | Retrieve detailed finding record and rule justification      |
| `PATCH` | `/api/v1/findings/:id/status` | Bearer | Update finding status (`ACTIVE`, `RESOLVED`, `ACKNOWLEDGED`) |

### 5. Recommendations (`/api/v1/recommendations`)

| Method | Endpoint                      | Access | Description                                                 |
| :----- | :---------------------------- | :----- | :---------------------------------------------------------- |
| `GET`  | `/api/v1/recommendations`     | Bearer | List prioritized remediation guidance for active findings   |
| `GET`  | `/api/v1/recommendations/:id` | Bearer | Retrieve step-by-step remediation instructions for platform |

### 6. Scores & History (`/api/v1/scores`)

| Method | Endpoint                                  | Access | Description                                                 |
| :----- | :---------------------------------------- | :----- | :---------------------------------------------------------- |
| `GET`  | `/api/v1/scores/device/:deviceId`         | Bearer | Retrieve latest deterministic posture score (0–100 or null) |
| `GET`  | `/api/v1/scores/device/:deviceId/history` | Bearer | Retrieve historical score trends and category metrics       |

### 7. AI Intelligence & Analysis (`/api/v1/ai`)

| Method | Endpoint                | Access | Description                                                            |
| :----- | :---------------------- | :----- | :--------------------------------------------------------------------- |
| `POST` | `/api/v1/ai/explain`    | Bearer | Generate plain-English explanation for a verified finding              |
| `POST` | `/api/v1/ai/message`    | Bearer | Analyze suspicious text/SMS message for phishing or social engineering |
| `POST` | `/api/v1/ai/url`        | Bearer | Analyze suspicious URL structure and redirection patterns              |
| `POST` | `/api/v1/ai/screenshot` | Bearer | Multimodal vision inspection of suspicious screenshots (Base64/PNG)    |

> **Note:** AI endpoints never alter or calculate numeric security scores.

### 8. Threat Intelligence (`/api/v1/threat-intel`)

| Method | Endpoint                          | Access | Description                                             |
| :----- | :-------------------------------- | :----- | :------------------------------------------------------ |
| `GET`  | `/api/v1/threat-intel/cve/:cveId` | Bearer | Query CISA KEV and OSV.dev vulnerability status for CVE |
| `POST` | `/api/v1/threat-intel/url`        | Bearer | Cross-reference URL against URLhaus and OpenPhish feeds |
| `GET`  | `/api/v1/threat-intel/stats`      | Bearer | Provider cache statistics and operational health        |

> **SSRF Protection:** External lookups undergo strict IPv4/IPv6 private address denylist validation before transmission.

### 9. Health & System Telemetry (`/api/v1/health`)

| Method | Endpoint                  | Access | Description                                               |
| :----- | :------------------------ | :----- | :-------------------------------------------------------- |
| `GET`  | `/api/v1/health`          | Public | Basic service health, uptime, and version                 |
| `GET`  | `/api/v1/health/detailed` | Public | Comprehensive health including PostgreSQL and Redis pings |

---

## Interactive OpenAPI Documentation

Sentinel generates OpenAPI 3.0 documentation automatically from NestJS decorators and DTOs.  
Start the backend and visit:

```
http://localhost:3000/api/docs
```
