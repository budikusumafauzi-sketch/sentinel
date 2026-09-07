# Security Policy

At Sentinel, security is not an afterthought or an add-on feature—it is the foundational core of everything we design, architect, and build. We take security vulnerabilities seriously and appreciate the efforts of researchers and community members who work to improve the security of Sentinel.

---

## Supported Versions

Only the latest release and the current active development branch (`main`) receive active security updates:

| Component                      | Version / Target      | Supported |
| :----------------------------- | :-------------------- | :-------: |
| Backend (`apps/backend`)       | `^0.1.0` (`main`)     |    ✅     |
| Mobile (`apps/mobile`)         | `^0.1.0` (`main`)     |    ✅     |
| Desktop Agent (`apps/desktop`) | `^0.1.0` (`main`)     |    ✅     |
| Pure Engine (`packages/types`) | `^0.1.0` (`main`)     |    ✅     |
| Legacy / Unversioned Snapshots | All previous versions |    ❌     |

---

## Reporting a Vulnerability

> [!CAUTION]
> **DO NOT file public GitHub issues for security vulnerabilities.** Public disclosure exposes users to risk before a defensive patch can be prepared and verified.

### Safe Reporting Channel

If you have discovered a potential security vulnerability in Sentinel, please report it via one of the following methods:

1. **GitHub Private Vulnerability Reporting:**  
   Navigate to the repository's **Security** tab and click **Report a vulnerability** to open an encrypted private disclosure advisory.
2. **Direct Security Contact:**  
   Send an encrypted report to our designated security mailbox:  
   `security@sentinel-cyber.internal` (or project maintainer contact).

### What to Include in Your Report

To help us investigate, triage, and remediate the issue promptly, please include as much of the following details as possible:

- **Vulnerability Description:** Clear explanation of the bug, including the affected component (`backend`, `mobile`, `desktop`, `types`, or `threat-intel`).
- **Proof of Concept (PoC):** Step-by-step instructions, minimal reproduction script, or payload demonstration.
- **Impact Assessment:** Explanation of what an attacker could achieve (e.g., unauthorized access, BOLA/IDOR, SSRF bypass, denial of service, telemetry tampering).
- **Suggested Fix / Remediation:** (Optional) Technical suggestion for addressing the root cause.

---

## Response Timeline & SLA

We are committed to handling security vulnerability reports with speed and diligence:

- **Initial Acknowledgment:** Within **48 hours** of receiving your report.
- **Triage & Severity Assessment:** Within **5 business days**, confirming whether the issue is reproducible and establishing severity using CVSS v3.1 standards.
- **Remediation & Patch Development:** High/Critical severity issues are prioritized for emergency patch release.
- **Coordinated Disclosure:** We work closely with the reporter to agree upon an appropriate disclosure window (typically 30–90 days, or immediately following release of the patch).

---

## Core Security Invariants

When evaluating potential vulnerabilities, please note Sentinel's foundational design invariants:

1. **Deterministic Scoring Invariance:** The security posture score ($0-100$) must always be calculated through deterministic rules in `@sentinel/types`. Any mechanism that allows an external actor or AI model to directly modify, bias, or bypass security score calculations is considered a critical security defect.
2. **Strict SSRF Boundary:** The threat intelligence subsystem operates behind a strict private IP and loopback denylist. Any mechanism allowing user input to trigger HTTP requests to RFC 1918, RFC 3927, or cloud metadata endpoints (`169.254.169.254`) is classified as high severity.
3. **Zero Plaintext Secrets:** No credentials, API tokens, or secrets may be stored in source control or emitted in API responses or logs. Unhandled exceptions are scrubbed by `AllExceptionsFilter`.
4. **Data Isolation (BOLA / IDOR):** Users may only view and mutate their own device records, scans, and telemetry. Cross-tenant or cross-user data access is strictly prohibited.

---

## Safe Harbor & Research Guidelines

We consider security research conducted under the following guidelines to be authorized:

- Make a good faith effort to avoid privacy violations, data destruction, and interruption or degradation of services.
- Do not access or modify data belonging to other users without explicit consent.
- Give us reasonable time to correct the issue before disclosing it publicly.
- Comply with applicable local and international laws.

Thank you for helping keep Sentinel and its users safe!
