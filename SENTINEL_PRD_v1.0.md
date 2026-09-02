# SENTINEL --- Product Requirements Document (PRD)

Version: 1.0 Status: LOCKED BASELINE Product: Sentinel --- Personal
Cybersecurity Intelligence Development Model: Vibe Coding Coding Agent:
OpenCode Local AI Coding Model: Ollama + Qwen Primary Development OS:
Windows Document Purpose: Single source of truth for product scope,
architecture, requirements, phases, and implementation direction.

------------------------------------------------------------------------

# 1. EXECUTIVE SUMMARY

Sentinel is a Personal Cybersecurity Intelligence platform designed to
help ordinary users understand, monitor, and improve the security
posture of their devices and digital environment.

The central concept is automatic-first security assessment.

Users should not be required to manually enter information that the
operating system or authorized APIs can obtain automatically. Sentinel
discovers available device information, evaluates security-related
signals, records evidence, calculates risk, explains findings, and
provides actionable recommendations.

Sentinel must be transparent about platform limitations. It must never
claim to have checked information that the operating system does not
expose.

The product combines:

-   Automatic device discovery
-   Automatic security scanning
-   Device/system/application/security analysis
-   Privacy and network assessment
-   Security scoring
-   Evidence-based findings
-   Security history
-   Continuous security event monitoring where supported
-   Threat intelligence
-   Digital threat analysis
-   Exposure monitoring
-   AI-assisted explanations and recommendations
-   Cross-device security visibility
-   Mobile application
-   Desktop security agent
-   Backend intelligence platform

Sentinel is NOT intended to become a general-purpose utility platform.
The scope defined in this document is locked.

------------------------------------------------------------------------

# 2. PRODUCT VISION

## Vision

Make personal cybersecurity understandable, measurable, transparent, and
actionable for everyday users.

## Product Promise

Sentinel should answer five questions:

1.  What is happening on my device?
2.  What security controls are currently active?
3.  What could put me at risk?
4.  Why does the issue matter?
5.  What should I do next?

## Core Principle

The user should not need to be a cybersecurity expert to understand
their security posture.

------------------------------------------------------------------------

# 3. PRODUCT POSITIONING

Sentinel is positioned as:

Personal Device & Digital Security Intelligence.

It is not positioned as:

-   A generic AI chatbot
-   A simple antivirus clone
-   A generic device information app
-   A password manager
-   A VPN service
-   A social network
-   A generic productivity application

Its differentiation comes from combining verified device intelligence,
evidence-based security assessment, risk scoring, threat intelligence,
and human-readable AI assistance in one coherent experience.

------------------------------------------------------------------------

# 4. NON-NEGOTIABLE PRODUCT PRINCIPLES

## 4.1 Automatic-first

If authorized system APIs can provide information automatically,
Sentinel should obtain it automatically.

Users should not manually enter:

-   Device model
-   OS version
-   Installed application list
-   Application metadata
-   Available security configuration information
-   Other data that can legitimately be discovered by the platform

## 4.2 Evidence-first

Security findings must be based on evidence.

A finding should be traceable to:

-   Source
-   Check
-   Result
-   Evidence
-   Timestamp
-   Confidence
-   Platform

## 4.3 Privacy-first

Sentinel must minimize collection.

Only data necessary for the declared security purpose should be
processed.

Sensitive data should not be retained unnecessarily.

## 4.4 Platform-aware

Android, iOS, Windows, macOS, and Linux do not expose identical
capabilities.

Sentinel must distinguish:

-   Verified
-   Analyzed
-   User-provided
-   Not available on this platform
-   Permission required
-   Unable to verify

## 4.5 Security engine is deterministic

AI must not be the sole authority for core security scoring.

Core assessment flow:

System data → Evidence → Security rules → Risk engine → Security score →
AI explanation

## 4.6 Action-oriented

Every meaningful finding should answer:

-   What happened?
-   Why does it matter?
-   How severe is it?
-   What evidence supports it?
-   What can the user do?

## 4.7 Scope locked

New features must not be added merely because they appear interesting or
technically impressive.

Improvements to existing scope are allowed. New product categories are
not.

------------------------------------------------------------------------

# 5. TARGET USERS

Primary users:

-   Everyday smartphone users
-   Laptop/desktop users
-   Students
-   Young professionals
-   Users with limited cybersecurity knowledge
-   Privacy-conscious users who want understandable security information

Secondary users:

-   Technical users
-   Developers
-   IT/networking learners
-   Security enthusiasts

The interface must remain approachable for non-experts while exposing
deeper technical evidence for advanced users.

------------------------------------------------------------------------

# 6. PLATFORM TARGETS

Primary:

-   Android
-   iOS
-   Windows

Future platform compatibility may be designed into the architecture, but
additional platforms are not a separate product scope unless explicitly
approved.

------------------------------------------------------------------------

# 7. CORE PRODUCT AREAS

Sentinel consists of five primary product areas:

1.  Overview
2.  Automatic Scan
3.  Protect
4.  Intelligence
5.  Profile

------------------------------------------------------------------------

# 8. OVERVIEW

The Overview is the primary security dashboard.

It should communicate the user's current security posture within
seconds.

## Required elements

-   Overall Security Score
-   Security status
-   Critical issues
-   High-risk issues
-   Medium-risk issues
-   Low-risk issues
-   Security categories
-   Recent security events
-   Priority recommendations
-   Last scan
-   Number of completed checks
-   Access to full scan report

## Example

Security Score: 92 Status: Secure

147 checks completed

Device: 96 Applications: 91 Privacy: 90 Network: 94 System: 95 Accounts:
88

No critical issues detected.

1 action recommended.

------------------------------------------------------------------------

# 9. AUTOMATIC SCAN

Automatic Scan is the core technical feature of Sentinel.

## Scan types

### Quick Scan

Performs the most important available security checks quickly.

### Full Scan

Performs the maximum relevant checks available to the platform.

### Continuous monitoring

Detects security-relevant changes when platform capabilities permit it.

## Scan lifecycle

Device discovery → System discovery → Application discovery → Permission
discovery → Network discovery → Privacy/security configuration discovery
→ Evidence collection → Security rules → Risk assessment → Score
calculation → Recommendations → Report

------------------------------------------------------------------------

# 10. DEVICE DISCOVERY

Sentinel should automatically identify available device information.

Possible information includes:

-   Manufacturer
-   Device model
-   OS
-   OS version
-   Security patch information where available
-   Hardware/security-related metadata available to the application
-   Device security state
-   Encryption state where exposed
-   Authentication/security configuration where exposed
-   Platform capabilities

Every field must have an availability state.

------------------------------------------------------------------------

# 11. SYSTEM INSPECTION

The system scanner evaluates available security-related OS signals.

Possible checks include:

-   OS version
-   Security update status
-   Security patch level where available
-   Encryption status where available
-   Authentication configuration
-   Screen lock/security state where exposed
-   Firewall/security services where exposed
-   Security configuration
-   Relevant platform protections
-   System security settings

No unsupported check may be presented as verified.

------------------------------------------------------------------------

# 12. APPLICATION DISCOVERY

The user must not manually enter installed applications.

Where the platform permits it, Sentinel automatically discovers
application metadata.

Potential data:

-   Application name
-   Package/bundle identifier where available
-   Version
-   Installation source where available
-   Permissions
-   Security-relevant metadata
-   Update state where available

Sentinel should categorize application findings based on evidence.

It must not automatically label an application as malicious without
sufficient evidence.

------------------------------------------------------------------------

# 13. PERMISSION ANALYSIS

Sentinel analyzes available application permissions.

Examples:

-   Camera
-   Microphone
-   Location
-   Contacts
-   Storage/files
-   Notifications
-   Network-related access
-   Other platform-specific sensitive permissions

The analysis should focus on excessive or unexpected exposure.

------------------------------------------------------------------------

# 14. NETWORK ANALYSIS

Sentinel evaluates security-relevant network signals available to the
platform.

Possible checks:

-   Current network state
-   Connection security
-   VPN state where available
-   DNS-related configuration where available
-   Network configuration
-   Suspicious network indicators where supported

Network findings must distinguish verified data from analytical
conclusions.

------------------------------------------------------------------------

# 15. PRIVACY ANALYSIS

Privacy analysis focuses on security-relevant privacy exposure.

Possible areas:

-   Sensitive permissions
-   Tracking-related settings where available
-   Privacy configuration
-   Application access to sensitive resources
-   Relevant platform privacy controls

Sentinel should explain privacy risk without unnecessarily collecting
private content.

------------------------------------------------------------------------

# 16. ACCOUNT SECURITY

Account security is part of the Protect and Intelligence areas.

Potential assessment areas:

-   MFA status where available
-   Authentication security
-   Account exposure
-   Security recommendations
-   Critical account prioritization

Account information that cannot be automatically accessed must be
user-provided or connected through authorized mechanisms.

Sentinel must clearly label user-provided information.

------------------------------------------------------------------------

# 17. SECURITY FINDINGS

Every finding should have a structured model.

Minimum fields:

-   Finding ID
-   Category
-   Title
-   Severity
-   Status
-   Evidence
-   Source
-   Platform
-   Timestamp
-   Confidence
-   Explanation
-   Recommendation
-   Resolution state

Example:

Title: Screen Lock Security

Status: Secure

Evidence: Secure authentication configuration detected.

Source: Operating System API

Confidence: 100%

------------------------------------------------------------------------

# 18. DATA TRUST MODEL

Sentinel uses explicit information provenance.

## VERIFIED

Directly obtained from an authorized system/API.

## USER PROVIDED

Explicitly supplied by the user.

## ANALYZED

Derived from evidence through security analysis.

## NOT AVAILABLE

The platform does not expose the required information.

## PERMISSION REQUIRED

The check is possible but requires user authorization.

## UNABLE TO VERIFY

The system attempted the check but could not establish a reliable
result.

This model must be reflected in the UI where appropriate.

------------------------------------------------------------------------

# 19. RISK ENGINE

The Risk Engine converts evidence into structured risk.

Inputs may include:

-   Severity
-   Impact
-   Likelihood
-   Exposure
-   Asset criticality
-   Security control state
-   Evidence confidence
-   Platform context

Output:

-   Risk score
-   Severity
-   Confidence
-   Priority
-   Recommendation priority

The exact scoring formula must be documented and versioned.

AI must not silently modify the deterministic security score.

------------------------------------------------------------------------

# 20. SECURITY SCORE

The Security Score summarizes the available security posture.

The score should be explainable.

A score must be based on actual completed checks, not invented data.

Example:

92 / 100

147 checks completed

Critical: 0 High: 1 Medium: 3 Low: 2

The UI must allow users to understand why the score changed.

------------------------------------------------------------------------

# 21. SECURITY HISTORY

Sentinel maintains historical security posture where appropriate.

Example:

Aug 31 --- 92 Aug 28 --- 87 Aug 20 --- 81 Aug 01 --- 76

Users can identify whether their security posture is improving or
declining.

History must avoid storing unnecessary sensitive raw data.

------------------------------------------------------------------------

# 22. SECURITY EVENTS

When supported, Sentinel detects relevant changes.

Examples:

-   New application detected
-   Security configuration changed
-   Security score changed
-   Relevant permission exposure changed
-   Security control changed

The event system should generate notifications only for meaningful
changes.

------------------------------------------------------------------------

# 23. PROTECT AREA

Protect is the structured security management area.

Sections:

-   Device
-   Applications
-   Accounts
-   Privacy
-   Network
-   System

Each section contains:

-   Current state
-   Security checks
-   Findings
-   Evidence
-   Recommendations
-   History where relevant

------------------------------------------------------------------------

# 24. INTELLIGENCE AREA

The Intelligence area provides deeper analysis.

Required components:

## Threat Analyzer

Analyzes potentially suspicious digital content.

## URL Analyzer

Analyzes URLs and domains using available threat intelligence and
security signals.

## Screenshot Analyzer

Analyzes screenshots for security-related indicators such as phishing or
suspicious prompts.

## Message Analyzer

Analyzes suspicious messages supplied by the user.

## Security Advisor

Explains findings and recommends prioritized actions.

## Exposure Monitoring

Assesses relevant exposure information through supported and authorized
data sources.

## Threat Intelligence

Uses appropriate legal/documented threat intelligence sources.

## Security Insights

Provides meaningful trends and observations derived from Sentinel's
security data.

------------------------------------------------------------------------

# 25. AI ARCHITECTURE

AI is an intelligence and explanation layer.

It must not replace the deterministic security engine.

Flow:

Security data → Security Engine → Structured finding → AI →
Explanation/recommendation

AI responsibilities:

-   Explain technical findings
-   Summarize security posture
-   Prioritize understandable recommendations
-   Analyze user-submitted threat material
-   Translate technical security information into accessible language
-   Provide contextual security advice

AI output should use structured schemas wherever possible.

------------------------------------------------------------------------

# 26. AI DEVELOPMENT ENVIRONMENT

The project itself will be built using vibe coding.

Primary coding agent:

OpenCode

Local model runtime:

Ollama

Primary coding model:

Qwen

Development principle:

The AI coding agent follows the PRD and architecture. It does not
redefine the product scope.

The human/project command structure remains:

User + Project Lead (ChatGPT) → Architecture and task definition →
OpenCode → Ollama/Qwen → Implementation → Testing → Review → Next
approved task

------------------------------------------------------------------------

# 27. FRONTEND TECHNOLOGY

## Mobile

-   React Native
-   Expo
-   TypeScript
-   Expo Router
-   NativeWind/custom design system
-   Zustand
-   TanStack Query
-   SQLite
-   Secure storage

The production application must use development builds/custom native
integration where required.

------------------------------------------------------------------------

# 28. NATIVE TECHNOLOGY

## Android

Kotlin

Used for platform-specific device/security capabilities.

## iOS

Swift

Used for platform-specific capabilities permitted by iOS.

## Windows/Desktop

Rust

Used for the security agent and system-level capabilities.

Desktop shell:

Tauri

------------------------------------------------------------------------

# 29. BACKEND TECHNOLOGY

-   Node.js
-   TypeScript
-   NestJS
-   Fastify
-   REST API
-   WebSocket
-   OpenAPI/Swagger

Backend responsibilities:

-   Authentication
-   Device management
-   Scan orchestration
-   Security findings
-   Risk calculations
-   Recommendations
-   Threat intelligence integration
-   AI orchestration
-   Notifications
-   History
-   API security

------------------------------------------------------------------------

# 30. DATABASE

Primary database:

PostgreSQL

ORM:

Prisma

Initial logical entities:

-   users
-   devices
-   device_snapshots
-   scans
-   scan_checks
-   security_findings
-   security_scores
-   recommendations
-   applications
-   application_permissions
-   security_events
-   threat_analyses
-   exposure_records

Database schema may evolve internally during implementation but must
remain within product scope.

------------------------------------------------------------------------

# 31. CACHE AND JOB PROCESSING

Redis:

-   Cache
-   Temporary state
-   Rate limiting
-   Queue infrastructure

BullMQ:

-   Scan jobs
-   Security analysis jobs
-   Threat analysis jobs
-   Exposure checks
-   Score recalculation
-   Notifications

Long-running operations must not block normal API requests.

------------------------------------------------------------------------

# 32. API SECURITY

Requirements:

-   HTTPS/TLS in production
-   Authentication
-   Authorization
-   Input validation
-   Rate limiting
-   Secure token handling
-   Secure error handling
-   Logging without sensitive leakage
-   API versioning
-   Strict CORS policy where applicable
-   Secrets stored outside source code

------------------------------------------------------------------------

# 33. MOBILE SECURITY

Sentinel must follow secure mobile development principles.

Areas:

-   Secure storage
-   Secure network communication
-   Authentication
-   Session management
-   Cryptography through trusted libraries
-   Platform permissions
-   Privacy
-   Code protection where appropriate
-   Secure logging
-   Data minimization

OWASP MASVS/MASTG should be used as a security verification reference.

------------------------------------------------------------------------

# 34. DESKTOP AGENT SECURITY

The desktop agent must be:

-   Read-only by default
-   Least privilege
-   Explicit about permissions
-   Securely authenticated to the backend
-   Resistant to tampering where practical
-   Careful about sensitive data
-   Efficient in CPU/RAM usage
-   Able to operate without unnecessary collection

The agent must not perform destructive actions unless such actions are
explicitly defined and approved as part of the existing scope.

------------------------------------------------------------------------

# 35. UI/UX DIRECTION

Visual direction:

-   Modern
-   Professional
-   Clean
-   Premium
-   Minimal
-   Human-designed appearance
-   Not visibly AI-generated
-   Responsive
-   Accessible
-   Information-dense without being cluttered

Reference language:

-   Clean financial application
-   Premium security utility
-   Modern system dashboard

Avoid:

-   Excessive gradients
-   Cyberpunk aesthetics
-   Excessive neon
-   Robot imagery
-   AI sparkle effects
-   Chatbot-first interface
-   Overly decorative dashboards

------------------------------------------------------------------------

# 36. RESPONSIVE DESIGN

Sentinel must adapt to:

-   Small phones
-   Large phones
-   Tablets
-   Laptop/desktop screens

Mobile:

Bottom navigation.

Tablet:

Adaptive navigation depending on orientation and available width.

Desktop:

Sidebar/navigation rail with larger content area.

The application must not simply stretch the mobile UI.

------------------------------------------------------------------------

# 37. PRIMARY NAVIGATION

Mobile:

-   Overview
-   Scan
-   Protect
-   Intelligence
-   Profile

Desktop:

Navigation rail/sidebar containing the same logical sections.

------------------------------------------------------------------------

# 38. OVERVIEW UI STRUCTURE

Concept:

SENTINEL

Security Score 92 SECURE

No critical issues detected.

Security categories:

Device Applications Privacy Network System Accounts

Then:

Priority action

Then:

Recent security activity

Then:

Last scan / checks completed

Then:

View full report

All information remains accessible from one vertically organized
overview.

------------------------------------------------------------------------

# 39. SCAN UI

Scan screen:

-   Quick Scan
-   Full Scan
-   Scan progress
-   Current check
-   Completed checks
-   Scan result
-   Findings
-   What Sentinel checked
-   Evidence
-   Full report

Example scan stages:

Detecting device Checking operating system Inspecting applications
Analyzing permissions Checking network Analyzing security configuration
Calculating risk

------------------------------------------------------------------------

# 40. FULL REPORT

The report must explain:

-   What was checked
-   What was found
-   What was not available
-   What passed
-   What requires attention
-   Evidence
-   Risk
-   Recommendations

Example:

147 checks completed

145 passed 2 require attention 0 critical

The user can drill down by category.

------------------------------------------------------------------------

# 41. "ALL SAFE" EXPERIENCE

If no meaningful issues are found, Sentinel must still explain what was
checked.

Example:

YOUR DEVICE LOOKS SECURE

147 checks completed 6 categories assessed 23 security controls
evaluated

No critical issues detected.

Checked:

-   Device security
-   Operating system
-   Applications
-   Permissions
-   Network configuration
-   Privacy configuration
-   Authentication
-   Security configuration

The product must not imply absolute security.

Use language such as:

"Based on the checks available to Sentinel..."

------------------------------------------------------------------------

# 42. UNSAFE EXPERIENCE

When issues exist:

Example:

2 Critical Issues

Security Score: 64

Finding: Primary account lacks MFA

Risk: Critical

Why it matters: A compromised password may be insufficiently protected.

Recommendation: Enable MFA.

Each finding must lead toward an appropriate next action.

------------------------------------------------------------------------

# 43. SECURITY EXPLANATION

Users can open "What is this?" or equivalent explanation.

Structure:

What is this? Why does it matter? What did Sentinel detect? How
confident is the result? What should I do? What happens if I ignore it?

Technical evidence remains available for advanced users.

------------------------------------------------------------------------

# 44. DEVICE MANAGEMENT

Profile/Devices area:

-   Connected devices
-   Device security score
-   Platform
-   Last seen
-   Last scan
-   Security state
-   Security events

Example:

ASUS Laptop Security: 91 Protected

Android Phone Security: 94 Protected

The mobile application may act as a security dashboard for the user's
connected desktop device.

------------------------------------------------------------------------

# 45. DESKTOP-MOBILE RELATIONSHIP

Windows:

Sentinel Desktop Agent → Secure communication → Sentinel Backend →
Mobile dashboard

The mobile app can display the desktop security posture without
requiring the mobile app itself to perform Windows system inspection.

------------------------------------------------------------------------

# 46. PRIVACY ARCHITECTURE

Data minimization requirements:

-   Collect only necessary data
-   Prefer metadata over raw content
-   Avoid permanent storage of sensitive analysis inputs
-   Temporary threat-analysis uploads should have controlled retention
-   Sensitive secrets must use secure storage
-   Backend logs must avoid sensitive payloads
-   Users should be informed about relevant data processing

------------------------------------------------------------------------

# 47. LOCAL DATA

Use local SQLite for:

-   Cached scan results
-   Non-sensitive local history
-   Offline UI state
-   Non-sensitive configuration

Use secure storage for:

-   Tokens
-   Device credentials
-   Cryptographic material
-   Other secrets

Do not use ordinary local storage for secrets.

------------------------------------------------------------------------

# 48. THREAT ANALYZER DATA FLOW

Example:

User submits URL/screenshot/message → Secure upload/input → Backend →
Threat analysis service → Threat intelligence where appropriate → AI
analysis where useful → Structured result → User-facing explanation →
Temporary data cleanup

The analyzer must clearly distinguish indicators from certainty.

------------------------------------------------------------------------

# 49. CONFIDENCE MODEL

Findings may display confidence.

Example:

OS Encryption: Verified Confidence: 100%

Threat classification: High Risk Confidence: 94%

Confidence must never be used as a replacement for evidence.

------------------------------------------------------------------------

# 50. ERROR HANDLING

The application must gracefully handle:

-   Permission denied
-   Unsupported API
-   Network unavailable
-   Backend unavailable
-   Partial scan
-   Timeout
-   API rate limits
-   Unsupported platform capability
-   AI unavailable
-   Threat intelligence unavailable

A partial scan must never be presented as a complete scan.

------------------------------------------------------------------------

# 51. OFFLINE BEHAVIOR

Where possible:

-   Previously cached security data remains viewable
-   Local non-sensitive scan information can remain accessible
-   New cloud-dependent intelligence checks wait until connectivity
    returns
-   UI clearly indicates stale data

Offline status must never imply current security verification.

------------------------------------------------------------------------

# 52. LOGGING AND OBSERVABILITY

Backend:

-   Structured logs
-   Request correlation IDs
-   Error tracking
-   Job monitoring
-   Security event logs
-   Performance metrics

Never log:

-   Passwords
-   Access tokens
-   Raw sensitive content
-   Secrets
-   Unnecessary personal data

------------------------------------------------------------------------

# 53. TESTING STRATEGY

## Frontend

-   Unit tests
-   Component tests
-   Integration tests
-   End-to-end tests

## Backend

-   Unit tests
-   Service tests
-   API tests
-   Database integration tests
-   Queue tests

## Native

-   Android native tests
-   iOS native tests
-   Desktop agent tests

## Security

-   OWASP MASVS/MASTG reference checks
-   Dependency auditing
-   Static analysis
-   Secret scanning
-   API security testing
-   Authentication testing
-   Authorization testing
-   Input validation testing

------------------------------------------------------------------------

# 54. DEVELOPMENT REPOSITORY

Recommended monorepo:

sentinel/

apps/ - mobile/ - desktop/ - web/

services/ - api/ - security-engine/ - ai-engine/ - workers/

packages/ - types/ - config/ - security-rules/ - ui/

native/ - android/ - ios/ - desktop/

infrastructure/ - docker/ - deployment/

docs/ - architecture/ - security/ - api/ - threat-model/

tests/

------------------------------------------------------------------------

# 55. TOOLING

Recommended:

-   Git
-   GitHub
-   Node.js
-   pnpm
-   Turborepo
-   TypeScript
-   ESLint
-   Prettier
-   Husky
-   lint-staged
-   Docker
-   GitHub Actions
-   Android Studio
-   JDK
-   Rust toolchain
-   VS Code or preferred editor
-   OpenCode
-   Ollama
-   Qwen

------------------------------------------------------------------------

# 56. DEVELOPMENT PHASES

The project is divided into ten phases.

The phases are implementation stages, not new product scopes.

------------------------------------------------------------------------

# PHASE 0 --- DEVELOPMENT ENVIRONMENT

Objective:

Prepare a stable development environment.

Tasks:

-   Verify Git
-   Verify Node.js
-   Install/configure pnpm
-   Install Docker Desktop
-   Install Android Studio
-   Configure JDK
-   Configure Android SDK
-   Install Rust
-   Install Ollama
-   Install/configure Qwen
-   Install/configure OpenCode
-   Verify development environment
-   Create project workspace

Definition of Done:

-   All required tools run successfully
-   Android emulator/device can be detected
-   Docker works
-   Node/pnpm work
-   Rust works
-   Ollama works
-   Qwen responds
-   OpenCode can operate in the repository

------------------------------------------------------------------------

# PHASE 1 --- PROJECT FOUNDATION

Objective:

Create the Sentinel monorepo and development skeleton.

Tasks:

-   Create Git repository
-   Create monorepo
-   Configure pnpm
-   Configure Turborepo
-   Create mobile application
-   Create backend
-   Create shared types package
-   Create documentation structure
-   Configure linting
-   Configure formatting
-   Configure environment variables
-   Create basic CI
-   Establish coding conventions

Definition of Done:

-   Repository builds
-   Mobile application launches
-   Backend launches
-   Shared package works
-   CI passes
-   No unnecessary features exist

------------------------------------------------------------------------

# PHASE 2 --- UI/UX FOUNDATION

Objective:

Implement the approved Sentinel design.

Tasks:

-   Design tokens
-   Typography
-   Spacing
-   Radius
-   Icons
-   Navigation
-   Overview
-   Scan
-   Protect
-   Intelligence
-   Profile
-   Responsive layouts
-   Loading states
-   Empty states
-   Error states
-   Secure states
-   Risk states
-   Scan progress UI
-   Full report UI

At this stage, data may be mocked.

Definition of Done:

-   Complete approved navigation exists
-   UI matches the product direction
-   Mobile and tablet layouts work
-   Desktop design direction is established
-   No out-of-scope UI features are added

------------------------------------------------------------------------

# PHASE 3 --- BACKEND + DATABASE

Objective:

Create the Sentinel backend foundation.

Tasks:

-   NestJS setup
-   Fastify
-   PostgreSQL
-   Prisma
-   Database schema
-   Migrations
-   Authentication
-   Device entities
-   Scan entities
-   Findings
-   Scores
-   Recommendations
-   API versioning
-   OpenAPI
-   Validation
-   Error handling
-   Security middleware
-   Redis
-   BullMQ foundation

Definition of Done:

-   Mobile can authenticate
-   Device can be registered
-   Scan records can be created
-   Findings can be stored
-   Scores can be stored
-   API is documented
-   Database migrations work

------------------------------------------------------------------------

# PHASE 4 --- DEVICE INTELLIGENCE

Objective:

Build automatic device inspection.

Android:

-   Kotlin native integration
-   Device scanner
-   System scanner
-   Application discovery where permitted
-   Permission discovery where permitted
-   Security signals
-   Platform capability reporting

iOS:

-   Swift native integration
-   Only permitted platform information

Desktop foundation:

-   Agent architecture
-   Secure device registration

Definition of Done:

-   Device information is discovered automatically
-   Platform limitations are represented correctly
-   No manual application list is required
-   Evidence is recorded
-   Unsupported checks are explicitly marked
-   Scanner is read-only by default

------------------------------------------------------------------------

# PHASE 5 --- SECURITY ENGINE

Objective:

Turn raw device information into security intelligence.

Tasks:

-   Evidence model
-   Security rule engine
-   Severity model
-   Risk model
-   Confidence model
-   Security score
-   Findings
-   Recommendations
-   Security categories
-   Scan report
-   Security history
-   Security event model

Definition of Done:

-   A scan produces structured evidence
-   Evidence produces deterministic findings
-   Findings produce risk
-   Risk produces explainable score
-   Score changes can be traced to findings
-   AI is not required for core scoring

------------------------------------------------------------------------

# PHASE 6 --- DESKTOP AGENT

Objective:

Build Windows security inspection.

Tasks:

-   Rust agent
-   Tauri integration where appropriate
-   Device identity
-   Secure authentication
-   System inspection
-   Software discovery
-   Network/security signals
-   Configuration checks
-   Evidence generation
-   Backend synchronization
-   Resource/performance controls

Definition of Done:

-   Windows agent runs
-   Device registers securely
-   Available system/security signals are collected
-   Results appear in Sentinel
-   Agent uses least privilege
-   No destructive actions are performed

------------------------------------------------------------------------

# PHASE 7 --- AI INTELLIGENCE

Objective:

Add AI as the explanation and intelligence layer.

Tasks:

-   AI service
-   Gemini integration
-   Structured AI schemas
-   Security explanations
-   Security Advisor
-   Threat Analyzer
-   Screenshot Analyzer
-   Message Analyzer
-   URL analysis orchestration
-   AI error handling
-   Prompt versioning
-   Output validation

Development AI remains:

OpenCode → Ollama → Qwen

Product AI remains a separate runtime architecture.

Definition of Done:

-   AI can explain verified findings
-   AI output is validated
-   AI cannot silently alter deterministic scores
-   AI failures do not break core security scanning

------------------------------------------------------------------------

# PHASE 8 --- THREAT INTELLIGENCE

Objective:

Add approved external intelligence sources.

Tasks:

-   Threat intelligence abstraction layer
-   URL/domain intelligence
-   CVE/security advisory intelligence where relevant
-   Exposure intelligence
-   Source reliability
-   Caching
-   Rate limits
-   Attribution/source tracking
-   Result normalization

Definition of Done:

-   External intelligence sources are modular
-   Results are traceable
-   External failure does not break the entire application
-   Findings distinguish source data from Sentinel analysis

------------------------------------------------------------------------

# PHASE 9 --- SECURITY HARDENING

Objective:

Make Sentinel itself secure and production-ready.

Tasks:

-   Threat model
-   Authentication hardening
-   Authorization review
-   API security
-   Mobile security review
-   Desktop agent security review
-   Secure storage verification
-   Secret scanning
-   Dependency auditing
-   Input validation
-   Rate limiting
-   Logging review
-   Privacy review
-   OWASP MASVS/MASTG checks
-   Security regression tests

Definition of Done:

-   Security requirements have evidence
-   Known critical issues resolved
-   Sensitive data handling reviewed
-   Security test suite passes
-   Production security baseline documented

------------------------------------------------------------------------

# PHASE 10 --- TESTING + PRODUCTION

Objective:

Prepare Sentinel for real-world release.

Tasks:

-   Full integration testing
-   E2E testing
-   Device matrix testing
-   Android testing
-   iOS testing
-   Windows testing
-   Performance testing
-   Reliability testing
-   Failure recovery
-   Production deployment
-   Monitoring
-   Documentation
-   Release process
-   Final portfolio documentation

Definition of Done:

-   Production builds are reproducible
-   Critical workflows pass
-   Security checks pass
-   Monitoring works
-   Documentation is complete
-   Release candidate is stable

------------------------------------------------------------------------

# 57. DEFINITION OF DONE --- GLOBAL

A feature is not considered complete merely because it runs.

It must satisfy:

1.  Functional correctness
2.  Security correctness
3.  Error handling
4.  Appropriate tests
5.  Documentation
6.  UI consistency
7.  Platform limitations
8.  Data provenance
9.  No unnecessary data collection
10. No scope expansion

------------------------------------------------------------------------

# 58. DEFINITION OF DONE --- SECURITY FINDING

A security finding must have:

-   Category
-   Severity
-   Evidence
-   Source
-   Timestamp
-   Platform
-   Confidence where applicable
-   Explanation
-   Recommendation

No evidence = no verified finding.

------------------------------------------------------------------------

# 59. DEFINITION OF DONE --- SCAN

A scan must provide:

-   Scan ID
-   Device
-   Start time
-   End time
-   Checks attempted
-   Checks completed
-   Checks unavailable
-   Findings
-   Score
-   Evidence
-   Errors/limitations
-   Final status

Possible statuses:

-   Complete
-   Partial
-   Failed
-   Cancelled

------------------------------------------------------------------------

# 60. SCOPE CONTROL

The following are explicitly outside the locked scope:

-   Social network
-   Marketplace
-   General-purpose chat platform
-   General file manager
-   VPN provider
-   Password manager product
-   Cryptocurrency features
-   Blockchain
-   Generic productivity tools
-   Unrelated AI assistants
-   Unrelated device utilities
-   Features added only for novelty

If a new idea is proposed, it must first be classified as:

A. Improvement to an existing requirement B. Required technical
implementation detail C. Out-of-scope feature

Only A and B may proceed automatically.

C requires explicit scope approval.

------------------------------------------------------------------------

# 61. PROJECT COMMAND STRUCTURE

The development workflow is:

User ↓ Project command / architecture direction ↓ PRD ↓ Phase objective
↓ Task definition ↓ OpenCode prompt ↓ Ollama + Qwen implementation ↓
Run/test ↓ Review ↓ Fix ↓ Commit ↓ Next approved task

The coding agent must not autonomously redefine architecture or product
scope.

------------------------------------------------------------------------

# 62. PROMPTING STANDARD FOR OPENCODE

Every major OpenCode task should include:

1.  Context
2.  Current phase
3.  Exact objective
4.  Files/components involved
5.  Requirements
6.  Constraints
7.  Security requirements
8.  Acceptance criteria
9.  Testing requirements
10. Explicit instruction not to add out-of-scope features

Example instruction principle:

"Implement only the requested task. Do not introduce new product
features, architecture, dependencies, or UI flows unless required to
satisfy the stated task."

------------------------------------------------------------------------

# 63. GIT STRATEGY

Use meaningful commits.

Examples:

-   chore: initialize sentinel monorepo
-   feat(mobile): create overview shell
-   feat(api): add device registration
-   feat(scanner): add android device discovery
-   feat(security): add evidence model
-   fix(scanner): handle unavailable security capability
-   test(api): add scan integration tests

Avoid giant unreviewed commits where possible.

------------------------------------------------------------------------

# 64. DOCUMENTATION STRATEGY

Required documentation:

-   README
-   Architecture
-   Product requirements
-   API
-   Database
-   Security architecture
-   Threat model
-   Device capability matrix
-   Scanner documentation
-   AI architecture
-   Deployment
-   Development guide
-   Testing guide
-   Security verification

The PRD remains the product scope authority.

------------------------------------------------------------------------

# 65. DEVICE CAPABILITY MATRIX

Sentinel must maintain a capability matrix.

Example:

  -----------------------------------------------------------------------------
  Capability        Android              iOS               Windows
  ----------------- -------------------- ----------------- --------------------
  Device discovery  Yes, subject to API  Limited by        Yes
                                         platform          

  App discovery     Platform-dependent   Highly restricted Yes

  Permission        Platform-dependent   Restricted        Platform-dependent
  analysis                                                 

  System security   Platform-dependent   Restricted        Broad
  checks                                                   

  Network checks    Platform-dependent   Restricted        Broad

  Background        Platform-dependent   Highly restricted Yes
  monitoring                                               

  Full system       No absolute          No                Agent-based
  inspection        guarantee                              
  -----------------------------------------------------------------------------

The matrix must be updated as implementation discovers real platform
capabilities.

------------------------------------------------------------------------

# 66. QUALITY BAR

Sentinel should feel like a real security product, not a student CRUD
application.

Quality priorities:

1.  Correctness
2.  Security
3.  Transparency
4.  UX
5.  Reliability
6.  Performance
7.  Maintainability
8.  Visual polish

Fancy features are lower priority than correct fundamentals.

------------------------------------------------------------------------

# 67. FINAL ARCHITECTURE

High-level:

SENTINEL

Mobile: React Native + Expo + TypeScript → Kotlin/Swift native modules →
Secure local storage/SQLite → Sentinel API

Desktop: Tauri + Rust → Native/system inspection → Sentinel API

Backend: NestJS + Fastify → REST/WebSocket → PostgreSQL + Prisma →
Redis + BullMQ

Security: Device data → Evidence → Rules → Risk Engine → Security Score
→ Recommendations

AI: Structured security data → AI service → Gemini →
Explanation/analysis

Development: OpenCode → Ollama → Qwen

Infrastructure: Docker → CI/CD → GitHub Actions → Production services

------------------------------------------------------------------------

# 68. FINAL TECHNOLOGY STACK

  Layer                    Technology
  ------------------------ ------------------------------------------------------------
  Mobile                   React Native
  Mobile framework         Expo
  Mobile language          TypeScript
  Navigation               Expo Router
  UI                       Custom Design System + NativeWind
  Client state             Zustand
  Server state             TanStack Query
  Local DB                 SQLite
  Secure storage           SecureStore/native secure storage
  Android native           Kotlin
  iOS native               Swift
  Desktop shell            Tauri
  Desktop agent/core       Rust
  Backend runtime          Node.js
  Backend framework        NestJS
  HTTP                     Fastify
  API                      REST
  Realtime                 WebSocket
  API docs                 OpenAPI/Swagger
  Database                 PostgreSQL
  ORM                      Prisma
  Cache                    Redis
  Queue                    BullMQ
  Product AI               Gemini API
  Development AI runtime   Ollama
  Development model        Qwen
  Coding agent             OpenCode
  Containers               Docker
  CI/CD                    GitHub Actions
  Testing                  Jest, React Native Testing Library, Supertest, E2E tooling
  Security reference       OWASP MASVS/MASTG
  Repository               GitHub
  Monorepo                 pnpm + Turborepo

------------------------------------------------------------------------

# 69. FINAL PRODUCT STATEMENT

Sentinel is a Personal Cybersecurity Intelligence platform that
automatically discovers available security information from a user's
devices, evaluates the security posture using evidence-based rules,
communicates platform limitations honestly, identifies meaningful risks,
explains why they matter, and guides the user toward practical security
improvements.

The product's defining characteristics are:

Automatic-first. Evidence-first. Privacy-first. Platform-aware.
AI-assisted, not AI-dependent. Action-oriented. Professional.
Responsive. Security-focused.

------------------------------------------------------------------------

# 70. IMPLEMENTATION COMMAND

This PRD is the baseline specification.

The project should be implemented phase by phase.

Do not attempt to build the entire platform in one coding-agent prompt.

The project command flow is:

PHASE 0 → Verify environment

PHASE 1 → Build foundation

PHASE 2 → Build approved UI

PHASE 3 → Build backend/database

PHASE 4 → Build device intelligence

PHASE 5 → Build security engine

PHASE 6 → Build desktop agent

PHASE 7 → Build AI intelligence

PHASE 8 → Build threat intelligence

PHASE 9 → Harden security

PHASE 10 → Test and productionize

At every phase:

Plan → Prompt OpenCode → Implement → Run → Test → Inspect → Fix → Review
→ Commit → Proceed

No phase should be considered complete until its Definition of Done is
satisfied.

------------------------------------------------------------------------

# 71. SCOPE LOCK

This document represents the agreed Sentinel product scope.

Do not add new product features outside this document without explicit
approval.

Existing features may be refined, optimized, secured, redesigned, or
implemented differently when technically necessary.

The goal is not to maximize the number of features.

The goal is to maximize the quality, reliability, security,
transparency, and usefulness of the agreed Sentinel product.

END OF PRD
