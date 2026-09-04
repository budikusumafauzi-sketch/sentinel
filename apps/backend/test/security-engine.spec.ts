import {
  executeSecurityEngine,
  calculateRiskScore,
  calculateSecurityScore,
  computeFindingFingerprint,
  generateSecurityEvents,
  generateSecurityHistory,
  generateRecommendations,
  reconcileFindingLifecycle,
  isEvidenceEligibleForFinding,
  SEVERITY_WEIGHTS,
  TRUST_CONFIDENCE_MAP,
  BASE_PENALTIES,
  RULESET_VERSION,
  RISK_MODEL_VERSION,
  EvidenceItem,
  EngineFinding,
} from '@sentinel/types';

describe('Sentinel Phase 5: Deterministic Security Engine', () => {
  const mockDeviceId = 'device-uuid-1234';

  const baseDeviceInfo = {
    manufacturer: 'Google',
    model: 'Pixel 8a',
    osVersion: '15',
    securityPatch: '2026-08-01',
    isEmulator: false,
    platform: 'ANDROID' as const,
  };

  const evalDate = new Date('2026-09-03T12:00:00Z');

  // ──────────────────────────────────────────
  // A. Evidence Eligibility (Section 6 & 12)
  // ──────────────────────────────────────────
  describe('A. Evidence Eligibility', () => {
    it('only allows VERIFIED and ANALYZED trust states to generate findings', () => {
      expect(isEvidenceEligibleForFinding('VERIFIED')).toBe(true);
      expect(isEvidenceEligibleForFinding('ANALYZED')).toBe(true);
      expect(isEvidenceEligibleForFinding('USER_PROVIDED')).toBe(false);
      expect(isEvidenceEligibleForFinding('NOT_AVAILABLE')).toBe(false);
      expect(isEvidenceEligibleForFinding('PERMISSION_REQUIRED')).toBe(false);
      expect(isEvidenceEligibleForFinding('UNABLE_TO_VERIFY')).toBe(false);
    });

    it('maps confidence weights accurately according to provenance', () => {
      expect(TRUST_CONFIDENCE_MAP['VERIFIED']).toBe(1.0);
      expect(TRUST_CONFIDENCE_MAP['ANALYZED']).toBe(0.85);
      expect(TRUST_CONFIDENCE_MAP['USER_PROVIDED']).toBe(0.75);
      expect(TRUST_CONFIDENCE_MAP['NOT_AVAILABLE']).toBe(0.0);
      expect(TRUST_CONFIDENCE_MAP['PERMISSION_REQUIRED']).toBe(0.0);
      expect(TRUST_CONFIDENCE_MAP['UNABLE_TO_VERIFY']).toBe(0.0);
    });

    it('does not generate findings for NOT_AVAILABLE or PERMISSION_REQUIRED checks', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'security.screen_lock',
          category: 'AUTHENTICATION',
          checkName: 'Screen Lock',
          value: false,
          trustState: 'NOT_AVAILABLE',
          source: 'KeyguardManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'NOT_AVAILABLE',
        },
        {
          checkId: 'network.wifi_ssid',
          category: 'NETWORK',
          checkName: 'Wi-Fi SSID',
          value: null,
          trustState: 'PERMISSION_REQUIRED',
          source: 'WifiInfo',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'PERMISSION_REQUIRED',
        },
      ];

      const result = executeSecurityEngine({
        scanId: 'scan-1',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
      });

      // No findings should be generated
      expect(result.findings).toHaveLength(0);
      expect(result.report.checksUnavailable).toBe(2);
      expect(result.report.status).toBe('PARTIAL');
    });
  });

  // ──────────────────────────────────────────
  // B. Severity & Risk Model (Section 10, 11, 13)
  // ──────────────────────────────────────────
  describe('B. Severity & Canonical Risk Model', () => {
    it('has canonical severity numeric weights', () => {
      expect(SEVERITY_WEIGHTS['CRITICAL']).toBe(5);
      expect(SEVERITY_WEIGHTS['HIGH']).toBe(4);
      expect(SEVERITY_WEIGHTS['MEDIUM']).toBe(3);
      expect(SEVERITY_WEIGHTS['LOW']).toBe(2);
    });

    it('matches golden vector for maximum risk (100% confidence)', () => {
      // S=5, I=5, L=5, E=5, A=5, C=5
      // weighted = 0.4*5 + 0.15*5 + 0.15*5 + 0.1*5 + 0.1*5 + 0.1*5 = 5.0
      // rawRisk = ((5 - 1) / 4) * 100 = 100
      // riskScore = round(100 * (0.7 + 0.3*1.0)) = 100
      const calc = calculateRiskScore(
        { severity: 5, impact: 5, likelihood: 5, exposure: 5, assetCriticality: 5, controlGap: 5 },
        1.0,
      );

      expect(calc.rawRisk).toBe(100);
      expect(calc.riskScore).toBe(100);
      expect(calc.priority).toBe('CRITICAL');
      expect(calc.riskModelVersion).toBe(RISK_MODEL_VERSION);
    });

    it('matches golden vector for minimum risk', () => {
      // S=1, I=1, L=1, E=1, A=1, C=1
      // weighted = 0.4*1 + 0.15*1 + 0.15*1 + 0.1*1 + 0.1*1 + 0.1*1 = 1.0
      // rawRisk = ((1 - 1) / 4) * 100 = 0
      // riskScore = 0
      const calc = calculateRiskScore(
        { severity: 1, impact: 1, likelihood: 1, exposure: 1, assetCriticality: 1, controlGap: 1 },
        1.0,
      );

      expect(calc.rawRisk).toBe(0);
      expect(calc.riskScore).toBe(0);
      expect(calc.priority).toBe('LOW');
    });

    it('adjusts risk score downward for reduced confidence (provenance)', () => {
      // S=4, I=4, L=4, E=4, A=4, C=5
      // weighted = 0.4*4 + 0.15*4 + 0.15*4 + 0.1*4 + 0.1*4 + 0.1*5 = 1.6 + 0.6 + 0.6 + 0.4 + 0.4 + 0.5 = 4.1
      // rawRisk = ((4.1 - 1) / 4) * 100 = 77.5
      const dims = {
        severity: 4,
        impact: 4,
        likelihood: 4,
        exposure: 4,
        assetCriticality: 4,
        controlGap: 5,
      };

      const calc100 = calculateRiskScore(dims, 1.0);
      // riskScore = round(77.5 * 1.0) = 78
      expect(calc100.riskScore).toBe(78);
      expect(calc100.priority).toBe('HIGH');

      const calc85 = calculateRiskScore(dims, 0.85); // ANALYZED
      // factor = 0.70 + 0.30*0.85 = 0.955
      // riskScore = round(77.5 * 0.955) = round(74.01) = 74
      expect(calc85.riskScore).toBe(74);
      expect(calc85.priority).toBe('HIGH');

      const calc75 = calculateRiskScore(dims, 0.75); // USER_PROVIDED
      // factor = 0.70 + 0.30*0.75 = 0.925
      // riskScore = round(77.5 * 0.925) = round(71.68) = 72
      expect(calc75.riskScore).toBe(72);
    });

    it('clamps risk score strictly to 0–100', () => {
      const calcOver = calculateRiskScore(
        {
          severity: 10,
          impact: 10,
          likelihood: 10,
          exposure: 10,
          assetCriticality: 10,
          controlGap: 10,
        },
        2.0,
      );
      expect(calcOver.riskScore).toBeLessThanOrEqual(100);

      const calcUnder = calculateRiskScore(
        {
          severity: -5,
          impact: -5,
          likelihood: -5,
          exposure: -5,
          assetCriticality: -5,
          controlGap: -5,
        },
        -1.0,
      );
      expect(calcUnder.riskScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ──────────────────────────────────────────
  // C. Security Score Model & Traceability (Section 14 & 15)
  // ──────────────────────────────────────────
  describe('C. Security Score Model & Traceability', () => {
    it('has canonical base penalties', () => {
      expect(BASE_PENALTIES['CRITICAL']).toBe(40);
      expect(BASE_PENALTIES['HIGH']).toBe(25);
      expect(BASE_PENALTIES['MEDIUM']).toBe(12);
      expect(BASE_PENALTIES['LOW']).toBe(5);
    });

    it('returns score = null when zero controls were evaluated (no fake 100)', () => {
      const breakdown = calculateSecurityScore(
        [],
        { DEVICE: 0, APPLICATIONS: 0, ACCOUNTS: 0, PRIVACY: 0, NETWORK: 0, SYSTEM: 0 },
        3,
        RULESET_VERSION,
      );

      expect(breakdown.score).toBeNull();
      expect(breakdown.evaluatedControlCount).toBe(0);
      expect(breakdown.unavailableCheckCount).toBe(3);
    });

    it('returns 100 when all evaluated controls pass with no findings', () => {
      const breakdown = calculateSecurityScore(
        [],
        { DEVICE: 3, APPLICATIONS: 2, ACCOUNTS: 0, PRIVACY: 1, NETWORK: 2, SYSTEM: 3 },
        0,
        RULESET_VERSION,
      );

      expect(breakdown.score).toBe(100);
      expect(breakdown.evaluatedControlCount).toBe(11);
      expect(breakdown.findingContributions).toHaveLength(0);
    });

    it('accurately calculates category score and finding penalties', () => {
      // 1 HIGH finding in DEVICE category with riskScore = 80
      // basePenalty = 25
      // findingPenalty = 25 * (80/100) = 20
      // categoryScore = 100 - 20 = 80
      const mockFinding: EngineFinding = {
        fingerprint: 'SEC-SYS-SCREEN-LOCK#device#keyguard#ANDROID',
        ruleId: 'SEC-SYS-SCREEN-LOCK',
        rulesetVersion: RULESET_VERSION,
        category: 'DEVICE',
        title: 'Device Screen Lock Disabled',
        description: 'No lock configured',
        severity: 'HIGH',
        status: 'ACTIVE',
        source: 'KeyguardManager',
        platform: 'ANDROID',
        confidence: 1.0,
        riskScore: 80,
        priority: 'HIGH',
        rawRisk: 80,
        dimensions: {
          severity: 4,
          impact: 4,
          likelihood: 4,
          exposure: 4,
          assetCriticality: 4,
          controlGap: 5,
        },
        evidence: [],
        explanation: 'Screen lock disabled',
        recommendationText: 'Set a screen lock',
      };

      const breakdown = calculateSecurityScore(
        [mockFinding],
        { DEVICE: 2, APPLICATIONS: 0, ACCOUNTS: 0, PRIVACY: 0, NETWORK: 0, SYSTEM: 2 },
        0,
        RULESET_VERSION,
      );

      expect(breakdown.categoryScores['DEVICE'].score).toBe(80);
      expect(breakdown.categoryScores['DEVICE'].totalPenalty).toBe(20);
      expect(breakdown.categoryScores['SYSTEM'].score).toBe(100);

      // Overall: (80 * 2 + 100 * 2) / 4 = 360 / 4 = 90
      expect(breakdown.score).toBe(90);

      // Verify complete score traceability
      expect(breakdown.findingContributions).toHaveLength(1);
      expect(breakdown.findingContributions[0]!).toEqual(
        expect.objectContaining({
          ruleId: 'SEC-SYS-SCREEN-LOCK',
          category: 'DEVICE',
          severity: 'HIGH',
          riskScore: 80,
          basePenalty: 25,
          penalty: 20,
        }),
      );
    });
  });

  // ──────────────────────────────────────────
  // D. Rule Catalog & Platform Context (Section 8, 9, 25)
  // ──────────────────────────────────────────
  describe('D. Rule Catalog & Platform Context', () => {
    it('detects disabled screen lock with HIGH severity', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'security.screen_lock',
          category: 'AUTHENTICATION',
          checkName: 'Screen Lock Configured',
          value: false,
          trustState: 'VERIFIED',
          source: 'KeyguardManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const res = executeSecurityEngine({
        scanId: 'scan-1',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
      });

      expect(res.findings).toHaveLength(1);
      const f = res.findings[0]!;
      expect(f.ruleId).toBe('SEC-SYS-SCREEN-LOCK');
      expect(f.severity).toBe('HIGH');
      expect(f.category).toBe('DEVICE');
      expect(f.status).toBe('ACTIVE');
    });

    it('detects inactive storage encryption with CRITICAL severity', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'security.storage_encryption',
          category: 'ENCRYPTION',
          checkName: 'Storage Encryption Status',
          value: 1, // ENCRYPTION_STATUS_INACTIVE
          trustState: 'VERIFIED',
          source: 'DevicePolicyManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const res = executeSecurityEngine({
        scanId: 'scan-1',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
      });

      expect(res.findings).toHaveLength(1);
      const f = res.findings[0]!;
      expect(f.ruleId).toBe('SEC-SYS-STORAGE-ENCRYPTION');
      expect(f.severity).toBe('CRITICAL');
      expect(f.category).toBe('DEVICE');
    });

    it('evaluates security patch age with deterministic thresholds', () => {
      // 1. <= 30 days -> no finding
      const freshPatch: EvidenceItem = {
        checkId: 'os.security_patch',
        category: 'UPDATE',
        checkName: 'Security Patch',
        value: '2026-08-20', // 14 days prior to evalDate 2026-09-03
        trustState: 'VERIFIED',
        source: 'Build.VERSION.SECURITY_PATCH',
        platform: 'ANDROID',
        timestamp: '2026-09-03T10:00:00Z',
        capabilityStatus: 'SUPPORTED',
      };

      const freshRes = executeSecurityEngine({
        scanId: 'scan-fresh',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence: [freshPatch],
        evaluationDate: evalDate,
      });
      expect(freshRes.findings.filter((f) => f.ruleId === 'SEC-SYS-SECURITY-PATCH')).toHaveLength(
        0,
      );

      // 2. 31–90 days -> MEDIUM
      const midPatch: EvidenceItem = {
        ...freshPatch,
        value: '2026-07-01', // ~64 days
      };

      const midRes = executeSecurityEngine({
        scanId: 'scan-mid',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence: [midPatch],
        evaluationDate: evalDate,
      });
      const midFinding = midRes.findings.find((f) => f.ruleId === 'SEC-SYS-SECURITY-PATCH');
      expect(midFinding).toBeDefined();
      expect(midFinding!.severity).toBe('MEDIUM');

      // 3. > 90 days -> HIGH
      const oldPatch: EvidenceItem = {
        ...freshPatch,
        value: '2026-05-01', // ~125 days
      };

      const oldRes = executeSecurityEngine({
        scanId: 'scan-old',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence: [oldPatch],
        evaluationDate: evalDate,
      });
      const oldFinding = oldRes.findings.find((f) => f.ruleId === 'SEC-SYS-SECURITY-PATCH');
      expect(oldFinding).toBeDefined();
      expect(oldFinding!.severity).toBe('HIGH');
    });

    it('distinguishes physical device ADB from emulator context', () => {
      const adbEvidence: EvidenceItem = {
        checkId: 'security.adb_debugging',
        category: 'CONFIGURATION',
        checkName: 'USB Debugging',
        value: true,
        trustState: 'VERIFIED',
        source: 'Settings.Global.ADB_ENABLED',
        platform: 'ANDROID',
        timestamp: '2026-09-03T10:00:00Z',
        capabilityStatus: 'SUPPORTED',
      };

      // Physical device: MEDIUM
      const physicalRes = executeSecurityEngine({
        scanId: 'scan-phys',
        deviceId: mockDeviceId,
        deviceInfo: { ...baseDeviceInfo, isEmulator: false },
        rawEvidence: [adbEvidence],
        evaluationDate: evalDate,
      });
      expect(physicalRes.findings[0]!.severity).toBe('MEDIUM');

      // Emulator: LOW with contextual explanation
      const emulatorRes = executeSecurityEngine({
        scanId: 'scan-emu',
        deviceId: mockDeviceId,
        deviceInfo: { ...baseDeviceInfo, isEmulator: true },
        rawEvidence: [adbEvidence],
        evaluationDate: evalDate,
      });
      expect(emulatorRes.findings[0]!.severity).toBe('LOW');
      expect(emulatorRes.findings[0]!.title).toContain('Emulator');
    });

    it('detects unknown sources installation risk with MEDIUM severity', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'security.unknown_sources',
          category: 'CONFIGURATION',
          checkName: 'Unknown Sources',
          value: true,
          trustState: 'VERIFIED',
          source: 'canRequestPackageInstalls()',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const res = executeSecurityEngine({
        scanId: 'scan-1',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
      });

      expect(res.findings).toHaveLength(1);
      expect(res.findings[0]!.ruleId).toBe('SEC-SYS-UNKNOWN-SOURCES');
      expect(res.findings[0]!.severity).toBe('MEDIUM');
    });

    it('flags applications with sensitive permission exposure conservatively without claiming malware', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'apps.inventory',
          category: 'APPLICATION',
          checkName: 'Installed Applications',
          value: {
            totalDiscovered: 2,
            applications: [
              {
                name: 'System Dialer',
                packageName: 'com.android.dialer',
                isSystemApp: true,
                grantedPermissions: [
                  'android.permission.READ_SMS',
                  'android.permission.PROCESS_OUTGOING_CALLS',
                ],
              },
              {
                name: 'Custom Utility App',
                packageName: 'com.custom.utility',
                isSystemApp: false,
                grantedPermissions: [
                  'android.permission.READ_SMS',
                  'android.permission.RECEIVE_SMS',
                ],
              },
            ],
          },
          trustState: 'VERIFIED',
          source: 'PackageManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const res = executeSecurityEngine({
        scanId: 'scan-1',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
      });

      const permFinding = res.findings.find((f) => f.ruleId === 'SEC-APP-SENSITIVE-PERMISSIONS');
      expect(permFinding).toBeDefined();
      expect(permFinding!.category).toBe('APPLICATIONS');
      expect(permFinding!.severity).toBe('MEDIUM');
      // Must not use inflammatory malware claims
      expect(permFinding!.explanation).not.toContain('malicious');
      expect(permFinding!.explanation).toContain('permissions');
    });
  });

  // ──────────────────────────────────────────
  // E. Finding Lifecycle & Fingerprinting (Section 17)
  // ──────────────────────────────────────────
  describe('E. Finding Lifecycle & Fingerprinting', () => {
    it('produces stable fingerprints without volatile timestamps', () => {
      const fp1 = computeFindingFingerprint('SEC-SYS-SCREEN-LOCK', 'dev-1', 'keyguard', 'ANDROID');
      const fp2 = computeFindingFingerprint('SEC-SYS-SCREEN-LOCK', 'dev-1', 'keyguard', 'ANDROID');
      expect(fp1).toBe(fp2);
      expect(fp1).toBe('SEC-SYS-SCREEN-LOCK#dev-1#keyguard#ANDROID');
    });

    it('reconciles active finding to RESOLVED when security control is compliant', () => {
      const previousFinding: EngineFinding = {
        fingerprint: 'SEC-SYS-SCREEN-LOCK#dev-1#keyguard#ANDROID',
        ruleId: 'SEC-SYS-SCREEN-LOCK',
        rulesetVersion: RULESET_VERSION,
        category: 'DEVICE',
        title: 'Device Screen Lock Disabled',
        description: 'No lock',
        severity: 'HIGH',
        status: 'ACTIVE',
        source: 'KeyguardManager',
        platform: 'ANDROID',
        confidence: 1.0,
        riskScore: 78,
        priority: 'HIGH',
        rawRisk: 78,
        dimensions: {
          severity: 4,
          impact: 4,
          likelihood: 4,
          exposure: 4,
          assetCriticality: 4,
          controlGap: 5,
        },
        evidence: [],
        explanation: 'Disabled',
        recommendationText: 'Set a lock',
      };

      // Current scan evaluated screen lock rule, and finding did NOT fire (screen lock is enabled!)
      const currentFindings: EngineFinding[] = [];
      const evaluatedRuleIds = new Set<string>(['SEC-SYS-SCREEN-LOCK']);

      const reconciled = reconcileFindingLifecycle(
        currentFindings,
        [previousFinding],
        evaluatedRuleIds,
      );

      expect(reconciled).toHaveLength(1);
      expect(reconciled[0]!.fingerprint).toBe(previousFinding.fingerprint);
      expect(reconciled[0]!.status).toBe('RESOLVED');
      expect(reconciled[0]!.resolvedAt).toBeDefined();
    });
  });

  // ──────────────────────────────────────────
  // F. Recommendations & Events (Section 16, 18, 19)
  // ──────────────────────────────────────────
  describe('F. Recommendations, Events, and History', () => {
    it('generates actionable deduplicated recommendations linked to findings', () => {
      const findings: EngineFinding[] = [
        {
          fingerprint: 'SEC-SYS-SCREEN-LOCK#dev-1#keyguard#ANDROID',
          ruleId: 'SEC-SYS-SCREEN-LOCK',
          rulesetVersion: RULESET_VERSION,
          category: 'DEVICE',
          title: 'Device Screen Lock Disabled',
          description: 'No lock configured',
          severity: 'HIGH',
          status: 'ACTIVE',
          source: 'KeyguardManager',
          platform: 'ANDROID',
          confidence: 1.0,
          riskScore: 78,
          priority: 'HIGH',
          rawRisk: 78,
          dimensions: {
            severity: 4,
            impact: 4,
            likelihood: 4,
            exposure: 4,
            assetCriticality: 4,
            controlGap: 5,
          },
          evidence: [],
          explanation: 'Disabled',
          recommendationText: 'Configure a secure PIN or password in settings.',
        },
      ];

      const recs = generateRecommendations(findings);
      expect(recs).toHaveLength(1);
      expect(recs[0]!.findingFingerprint).toBe(findings[0]!.fingerprint);
      expect(recs[0]!.priority).toBe('HIGH');
      expect(recs[0]!.status).toBe('PENDING');
    });

    it('generates non-noisy security events on delta and zero events on identical scans', () => {
      const finding1: EngineFinding = {
        fingerprint: 'SEC-SYS-SCREEN-LOCK#dev-1#keyguard#ANDROID',
        ruleId: 'SEC-SYS-SCREEN-LOCK',
        rulesetVersion: RULESET_VERSION,
        category: 'DEVICE',
        title: 'Device Screen Lock Disabled',
        description: 'No lock configured',
        severity: 'HIGH',
        status: 'ACTIVE',
        source: 'KeyguardManager',
        platform: 'ANDROID',
        confidence: 1.0,
        riskScore: 78,
        priority: 'HIGH',
        rawRisk: 78,
        dimensions: {
          severity: 4,
          impact: 4,
          likelihood: 4,
          exposure: 4,
          assetCriticality: 4,
          controlGap: 5,
        },
        evidence: [],
        explanation: 'Disabled',
        recommendationText: 'Set lock',
      };

      // 1. New finding detected
      const newEvents = generateSecurityEvents('scan-2', mockDeviceId, [finding1], [], 78, 100);
      expect(newEvents.some((e) => e.type === 'NEW_FINDING')).toBe(true);

      // 2. Unchanged scan: same finding, same score -> 0 events
      const noEvents = generateSecurityEvents(
        'scan-3',
        mockDeviceId,
        [finding1],
        [finding1],
        78,
        78,
      );
      expect(noEvents).toHaveLength(0);

      // 3. Finding resolved
      const resolveEvents = generateSecurityEvents('scan-4', mockDeviceId, [], [finding1], 100, 78);
      expect(resolveEvents.some((e) => e.type === 'RESOLVED_FINDING')).toBe(true);
      expect(resolveEvents.some((e) => e.type === 'SCORE_CHANGED')).toBe(true);
    });

    it('generates security history with correct posture trend', () => {
      const breakdown75 = {
        ...calculateSecurityScore(
          [],
          { DEVICE: 2, APPLICATIONS: 0, ACCOUNTS: 0, PRIVACY: 0, NETWORK: 0, SYSTEM: 2 },
          0,
          RULESET_VERSION,
        ),
        score: 75,
      };

      const histInitial = generateSecurityHistory('scan-1', mockDeviceId, breakdown75, []);
      expect(histInitial.trend).toBe('INITIAL');

      // Score improved to 95
      const breakdown95 = { ...breakdown75, score: 95 };
      const histImproved = generateSecurityHistory(
        'scan-2',
        mockDeviceId,
        breakdown95,
        [],
        histInitial,
      );
      expect(histImproved.trend).toBe('IMPROVING');
      expect(histImproved.scoreDelta).toBe(20);
    });
  });

  // ──────────────────────────────────────────
  // G. Complete Determinism (Section 26-M)
  // ──────────────────────────────────────────
  describe('G. Engine Determinism', () => {
    it('produces identical output for repeated executions on identical input', () => {
      const rawEvidence: EvidenceItem[] = [
        {
          checkId: 'security.screen_lock',
          category: 'AUTHENTICATION',
          checkName: 'Screen Lock Configured',
          value: false,
          trustState: 'VERIFIED',
          source: 'KeyguardManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.storage_encryption',
          category: 'ENCRYPTION',
          checkName: 'Storage Encryption Status',
          value: 3, // ACTIVE
          trustState: 'VERIFIED',
          source: 'DevicePolicyManager',
          platform: 'ANDROID',
          timestamp: '2026-09-03T10:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const run1 = executeSecurityEngine({
        scanId: 'scan-fixed',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
        scanStartedAt: '2026-09-03T12:00:00.000Z',
        scanCompletedAt: '2026-09-03T12:00:01.000Z',
      });

      const run2 = executeSecurityEngine({
        scanId: 'scan-fixed',
        deviceId: mockDeviceId,
        deviceInfo: baseDeviceInfo,
        rawEvidence,
        evaluationDate: evalDate,
        scanStartedAt: '2026-09-03T12:00:00.000Z',
        scanCompletedAt: '2026-09-03T12:00:01.000Z',
      });

      expect(run1.report.overallScore).toBe(run2.report.overallScore);
      expect(run1.findings).toEqual(run2.findings);
      expect(run1.scoreBreakdown).toEqual(run2.scoreBreakdown);
      expect(run1.recommendations).toEqual(run2.recommendations);
    });
  });

  // ──────────────────────────────────────────
  // H. Phase 6: Windows Desktop Agent Evidence
  // ──────────────────────────────────────────
  describe('H. Phase 6: Windows Desktop Agent Evidence', () => {
    const windowsDeviceInfo = {
      manufacturer: 'ASUS',
      model: 'ZenBook UX425',
      osVersion: 'Windows 11 Pro (Build 26100)',
      platform: 'WINDOWS' as const,
      isEmulator: false,
    };

    it('produces healthy score with zero findings when Windows controls are verified secure', () => {
      const windowsEvidence: EvidenceItem[] = [
        {
          checkId: 'security.firewall_active',
          category: 'NETWORK',
          checkName: 'Windows Firewall',
          value: true,
          trustState: 'VERIFIED',
          source: 'netsh.advfirewall',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.realtime_protection',
          category: 'SYSTEM',
          checkName: 'Microsoft Defender Real-Time Protection',
          value: true,
          trustState: 'VERIFIED',
          source: 'Get-MpComputerStatus',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.uac_enabled',
          category: 'SYSTEM',
          checkName: 'User Account Control',
          value: true,
          trustState: 'VERIFIED',
          source: 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.storage_encryption',
          category: 'ENCRYPTION',
          checkName: 'BitLocker Drive Encryption',
          value: true,
          trustState: 'VERIFIED',
          source: 'manage-bde.status',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.screen_lock',
          category: 'AUTHENTICATION',
          checkName: 'Screen Lock Configured',
          value: true,
          trustState: 'VERIFIED',
          source: 'Windows.Security.Credentials',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const result = executeSecurityEngine({
        scanId: 'scan-win-secure',
        deviceId: 'win-device-01',
        deviceInfo: windowsDeviceInfo,
        rawEvidence: windowsEvidence,
        evaluationDate: evalDate,
      });

      expect(result.findings).toHaveLength(0);
      expect(result.report.status).toBe('COMPLETED');
      expect(result.report.overallScore).toBe(100);
      expect(result.scoreBreakdown.evaluatedControlCount).toBe(5);
      expect(result.scoreBreakdown.unavailableCheckCount).toBe(0);
    });

    it('generates deterministic findings when Windows controls are verified disabled', () => {
      const insecureWindowsEvidence: EvidenceItem[] = [
        {
          checkId: 'security.firewall_active',
          category: 'NETWORK',
          checkName: 'Windows Firewall',
          value: false,
          trustState: 'VERIFIED',
          source: 'netsh.advfirewall',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.realtime_protection',
          category: 'SYSTEM',
          checkName: 'Microsoft Defender Real-Time Protection',
          value: false,
          trustState: 'VERIFIED',
          source: 'Get-MpComputerStatus',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.uac_enabled',
          category: 'SYSTEM',
          checkName: 'User Account Control',
          value: false,
          trustState: 'VERIFIED',
          source: 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
      ];

      const result = executeSecurityEngine({
        scanId: 'scan-win-insecure',
        deviceId: 'win-device-02',
        deviceInfo: windowsDeviceInfo,
        rawEvidence: insecureWindowsEvidence,
        evaluationDate: evalDate,
      });

      expect(result.findings.length).toBeGreaterThanOrEqual(3);
      const ruleIds = result.findings.map((f) => f.ruleId);
      expect(ruleIds).toContain('SEC-WIN-FIREWALL');
      expect(ruleIds).toContain('SEC-WIN-ANTIVIRUS');
      expect(ruleIds).toContain('SEC-WIN-UAC');
      expect(result.report.overallScore).toBeLessThan(100);
    });

    it('honestly treats NOT_AVAILABLE or PERMISSION_REQUIRED checks without penalizing user', () => {
      const partialEvidence: EvidenceItem[] = [
        {
          checkId: 'security.firewall_active',
          category: 'NETWORK',
          checkName: 'Windows Firewall',
          value: true,
          trustState: 'VERIFIED',
          source: 'netsh.advfirewall',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'SUPPORTED',
        },
        {
          checkId: 'security.storage_encryption',
          category: 'ENCRYPTION',
          checkName: 'BitLocker Encryption',
          value: null,
          trustState: 'PERMISSION_REQUIRED',
          source: 'manage-bde.status',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'PERMISSION_REQUIRED',
          notes: 'Elevation required to read volume master key status',
        },
        {
          checkId: 'security.tpm_present',
          category: 'SYSTEM',
          checkName: 'TPM Security Hardware',
          value: null,
          trustState: 'NOT_AVAILABLE',
          source: 'Get-Tpm',
          platform: 'WINDOWS',
          timestamp: '2026-09-03T12:00:00Z',
          capabilityStatus: 'NOT_AVAILABLE',
          notes: 'TPM hardware module not detected on platform',
        },
      ];

      const result = executeSecurityEngine({
        scanId: 'scan-win-partial',
        deviceId: 'win-device-03',
        deviceInfo: windowsDeviceInfo,
        rawEvidence: partialEvidence,
        evaluationDate: evalDate,
      });

      // No findings for missing TPM or BitLocker permission
      expect(result.findings).toHaveLength(0);
      expect(result.report.status).toBe('PARTIAL');
      expect(result.scoreBreakdown.unavailableCheckCount).toBe(2);
      expect(result.report.errorsOrLimitations.length).toBe(2);
      expect(result.report.overallScore).toBe(100); // 1 verified control was clean
    });
  });
});
