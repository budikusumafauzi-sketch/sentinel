# Sentinel Deterministic Security Engine Specification

**Document Version:** 1.0.0  
**Status:** Locked Specification (Phase 5)  
**Classification:** Internal Core Security Architecture

---

## 1. Executive Summary & Philosophy

The Sentinel Security Engine is an isolated, deterministic, explainable rule and scoring engine that translates raw device signals into prioritized security findings, actionable remediations, category-level evaluations, and an overall device security posture score.

### Core Invariants

1. **Deterministic Execution:**  
   Given the identical set of evidence inputs, device context, and ruleset version, the engine will always produce the exact same findings, risk scores, category scores, and recommendations. Randomness, unseeded identifiers, and volatile clocks are strictly prohibited from finding fingerprinting or scoring.

2. **Conservative Evidence Trust Model:**  
   No security finding can be created from absent, speculative, or unverified data:
   - Only signals marked `VERIFIED`, `ANALYZED`, or `USER_PROVIDED` are eligible for rule evaluation.
   - Signals marked `NOT_AVAILABLE`, `PERMISSION_REQUIRED`, or `UNABLE_TO_VERIFY` are strictly ineligible for negative findings.
   - The engine never penalizes the user's score for platform limitations or missing permissions.

3. **Honest Coverage & Transparency:**  
   If zero controls can be evaluated for a device, the engine reports an overall score of `null` (`INSUFFICIENT_COVERAGE`) rather than a misleading "100% Secure".
   When no issues are found, client interfaces use honest terminology: _"Based on the checks available to Sentinel, no active security issues were detected across evaluated controls."_ Absolute security is never claimed.

4. **Pure & Cross-Platform:**  
   The core engine resides in `@sentinel/types` as pure functions without native dependencies, database locks, or external network requests. It executes identically in server runtimes (Node.js NestJS backend) and mobile client runtimes (React Native Expo client offline mode).

---

## 2. Architectural Architecture

```
                    ┌─────────────────────────────────────────┐
                    │ Raw Evidence Items (with Provenance)     │
                    │ Device Context (OS, Model, Emulator)    │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ Evidence Eligibility Filter             │
                    │ - Trust: VERIFIED, ANALYZED, USER_PROV. │
                    │ - Rejects: NOT_AVAILABLE, PERM_REQ.     │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ Deterministic Rule Evaluator            │
                    │ - SEC-SYS-SCREEN-LOCK                   │
                    │ - SEC-SYS-STORAGE-ENCRYPTION            │
                    │ - SEC-SYS-SECURITY-PATCH                │
                    │ - SEC-SYS-DEV-DEBUGGING                 │
                    │ - SEC-SYS-UNKNOWN-SOURCES               │
                    │ - SEC-APP-SENSITIVE-PERMISSIONS         │
                    │ - SEC-APP-SIDELOADED                    │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ Canonical Risk Calculator (0 - 100)     │
                    │ - S, I, L, E, A, C dimensions           │
                    │ - Confidence adjustment factor          │
                    │ - Priority bands (CRITICAL..LOW)        │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ Scoring & Breakdown Module              │
                    │ - Category Scores (0 - 100)             │
                    │ - Evaluated-Control Weighted Posture    │
                    │ - Explainable Penalty Breakdown         │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ Lifecycle & Event Reconciler            │
                    │ - Fingerprint: ruleId#devId#asset#plat  │
                    │ - ACTIVE -> RESOLVED transitions        │
                    │ - Meaningful non-noisy security events  │
                    │ - Security Posture History Trend        │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │ CompleteScanReport (Structured JSON)    │
                    └─────────────────────────────────────────┘
```

---

## 3. Severity & Canonical Risk Model

### 3.1 Severity Levels

Every finding has an inherent `EngineSeverity`:

- `CRITICAL`: Immediate compromise, unencrypted storage, or active exploit exposure.
- `HIGH`: Major control absence (e.g. no screen lock, outdated patch > 90 days).
- `MEDIUM`: Moderate configuration exposure (e.g. unknown sources, ADB on physical device).
- `LOW`: Informational hygiene (e.g. sideloaded package from non-store installer).

### 3.2 Canonical Risk Dimensions (Scale 1 – 5)

1. **Severity ($S$, Weight: $0.40$):** Inherent threat potential of the vulnerability.
2. **Impact ($I$, Weight: $0.15$):** Extent of damage to confidentiality, integrity, or availability.
3. **Likelihood ($L$, Weight: $0.15$):** Probability of successful exploitation or unauthorized access.
4. **Exposure ($E$, Weight: $0.10$):** Attack surface reachability (local, physical, adjacent, remote).
5. **Asset Criticality ($A$, Weight: $0.10$):** Importance of the affected component (core OS vs third-party app).
6. **Control Gap ($C$, Weight: $0.10$):** Deficiency of existing compensatory controls.

### 3.3 The Canonical Phase 5 Risk Formula

$$\text{weightedScore} = 0.40S + 0.15I + 0.15L + 0.10E + 0.10A + 0.10C$$

$$\text{rawRisk} = \left(\frac{\text{weightedScore} - 1}{4}\right) \times 100$$

$$\text{confidenceFactor} = 0.70 + 0.30 \times \text{confidence}$$

$$\text{riskScore} = \text{round}\Big(\text{rawRisk} \times \text{confidenceFactor}\Big)$$

The resulting `riskScore` is strictly clamped to $[0, 100]$.

#### Confidence Weightings by Data Trust State

- `VERIFIED` = $1.00$ (Full raw risk applied)
- `ANALYZED` = $0.85$ ($95.5\%$ effective risk factor)
- `USER_PROVIDED` = $0.75$ ($92.5\%$ effective risk factor)
- `NOT_AVAILABLE` / `PERMISSION_REQUIRED` / `UNABLE_TO_VERIFY` = Ineligible for findings.

### 3.4 Priority Bands

- `CRITICAL`: Risk Score $85 - 100$
- `HIGH`: Risk Score $70 - 84$
- `MEDIUM`: Risk Score $40 - 69$
- `LOW`: Risk Score $0 - 39$

---

## 4. Scoring Algorithm & Category Math

### 4.1 Base Severity Penalties

- `CRITICAL` = $40$ base penalty points
- `HIGH` = $25$ base penalty points
- `MEDIUM` = $12$ base penalty points
- `LOW` = $5$ base penalty points

### 4.2 Finding Contribution Formula

Each active finding deducts an explainable point contribution from its parent category:

$$\text{findingPenalty} = \text{basePenalty} \times \left(\frac{\text{riskScore}}{100}\right)$$

### 4.3 Category Scoring

Sentinel defines six canonical security categories:

1. `DEVICE`: Hardware integrity, screen lock, biometrics, hardware keystore.
2. `SYSTEM`: Operating system version, security patch level, developer settings, encryption.
3. `APPLICATIONS`: Installed application hygiene, permissions, sideloading, installers.
4. `NETWORK`: Wi-Fi security, cellular transport, active VPN status.
5. `PRIVACY`: Camera, microphone, background location, tracking permissions.
6. `ACCOUNTS`: Authenticator hygiene, credential management, accounts presence.

For each category:
$$\text{categoryScore} = \max\left(0, \text{round}\left(100 - \sum_{f \in \text{CategoryFindings}} \text{findingPenalty}_f\right)\right)$$

If zero controls were evaluated for a given category, its score defaults to $100$ (clean), but its weight in the overall device score is zero.

### 4.4 Overall Device Security Score

The overall security score is computed as an evaluated-control-weighted average of all active categories:

$$\text{overallScore} = \text{round}\left(\frac{\sum (\text{categoryScore}_k \times \text{evaluatedControls}_k)}{\sum \text{evaluatedControls}_k}\right)$$

#### Invariant: Zero Evaluated Controls

$$\sum \text{evaluatedControls} = 0 \implies \text{overallScore} = \text{null}$$

---

## 5. Initial Rule Catalog

| Rule ID                         | Category       | Severity                      | Description                                                                          | Remediated When                                    |
| :------------------------------ | :------------- | :---------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------- |
| `SEC-SYS-SCREEN-LOCK`           | `DEVICE`       | `HIGH`                        | Keyguard / screen lock is not secured with PIN, pattern, or password.                | Lock is enabled in device settings.                |
| `SEC-SYS-STORAGE-ENCRYPTION`    | `SYSTEM`       | `CRITICAL`                    | Device flash storage is unencrypted or unsupported.                                  | Full-disk or file-based encryption is active.      |
| `SEC-SYS-SECURITY-PATCH`        | `SYSTEM`       | `MEDIUM` / `HIGH`             | Android security patch level is older than 30 days (`MEDIUM`) or 90 days (`HIGH`).   | System is updated to latest vendor patch.          |
| `SEC-SYS-DEV-DEBUGGING`         | `SYSTEM`       | `MEDIUM` (Phys) / `LOW` (Emu) | USB Debugging (ADB) is enabled on a physical production device.                      | USB debugging is toggled off in Developer Options. |
| `SEC-SYS-UNKNOWN-SOURCES`       | `APPLICATIONS` | `MEDIUM`                      | Installation of applications from unknown/untrusted sources is globally permitted.   | Unknown sources setting is disabled.               |
| `SEC-APP-SENSITIVE-PERMISSIONS` | `APPLICATIONS` | `MEDIUM`                      | Non-system application holds dangerous permission cluster (SMS, Location, Contacts). | User reviews or revokes unnecessary permissions.   |
| `SEC-APP-SIDELOADED`            | `APPLICATIONS` | `LOW`                         | Application installed outside official package stores (e.g. browser, file manager).  | Package verified by user or reinstalled via store. |

---

## 6. Finding Lifecycle & Fingerprinting

### 6.1 Deterministic Fingerprint

To ensure findings can be tracked, resolved, and correlated across consecutive scans without depending on mutable timestamps or random UUIDs, every finding is fingerprinted using:

$$\text{fingerprint} = \text{sha256}\big(\texttt{ruleId\#deviceId\#assetKey\#platform}\big)$$

### 6.2 Lifecycle State Transitions

- `ACTIVE`: The evaluated control fails inspection on the current scan.
- `RESOLVED`: The control was previously `ACTIVE`, but on the current scan the relevant check was evaluated and passed.
- `MUTED` / `IGNORED`: Explicit user policy exclusion (reserved for user management).

---

## 7. Security History & Event Generation

### 7.1 Non-Noisy Event Policy

Identical consecutive scans produce **zero** events. Events are only triggered by genuine state changes:

- `NEW_FINDING`: A new vulnerability is detected.
- `RESOLVED_FINDING`: An existing finding passes inspection.
- `SEVERITY_CHANGED`: An existing finding's severity level changes (e.g. patch becomes >90 days old).
- `SCORE_CHANGED`: Posture score changes by $\ge 3$ points.

### 7.2 Posture Trend Classification

- `INITIAL`: First baseline scan for a device.
- `IMPROVING`: Score increased by $> 0$ points.
- `DECLINING`: Score decreased by $< 0$ points.
- `UNCHANGED`: Score delta equals $0$ points.

---

## 8. Explainability & Complete Scan Report Model

Every scan report returned by the engine adheres to `CompleteScanReport`:

- `scanId`, `deviceId`, `evaluatedAt`, `rulesetVersion`, `overallScore`
- `status`: `COMPLETED` or `PARTIAL` (if any checks had limitations)
- `scoreBreakdown`:
  - `score`, `baselineScore`, `totalDeductions`
  - `evaluatedControls`, `unavailableChecks`
  - `findingContributions`: Exact point deduction per finding
  - `categoryBreakdown`: Per-category scores and control counts
- `findings`: Array of active and resolved findings with risk scores and provenance
- `recommendations`: Actionable deduplicated remediation items
- `events`: Only non-noisy events generated during this run
- `historyContext`: Score delta and trend comparison
- `errorsOrLimitations`: Disclosed platform boundaries (e.g. Android 11+ package visibility)
