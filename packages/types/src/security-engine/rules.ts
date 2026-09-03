/**
 * Sentinel Phase 5: Conservative Security Rule Catalog (Section 8 & 9).
 *
 * Ruleset Version:
 * - rulesetVersion = "1.0.0"
 *
 * Requirements:
 * - Pure / deterministic
 * - Versioned, explicit, testable, explainable, platform-aware, evidence-driven
 * - Evidence eligibility: ONLY VERIFIED / explicit ANALYZED evidence generates findings
 * - Missing evidence is NEVER an insecure finding
 */

import type {
  EngineSeverity,
  RiskDimensions,
  RuleEvaluationContext,
  RuleEvaluationResult,
  SecurityRule,
} from './types';
import { isEvidenceEligibleForFinding } from './risk';

export const RULESET_VERSION = '1.0.0';

/**
 * 1. Screen Lock Disabled / Insecure
 * Detects when keyguard / screen lock is explicitly verified as disabled.
 */
export const ruleScreenLock: SecurityRule = {
  ruleId: 'SEC-SYS-SCREEN-LOCK',
  rulesetVersion: RULESET_VERSION,
  category: 'DEVICE',
  title: 'Device Screen Lock Disabled',
  description: 'The device does not have a screen lock (PIN, password, or pattern) configured.',
  defaultSeverity: 'HIGH',
  requiredCheckIds: ['security.screen_lock'],
  platformApplicability: ['ANDROID', 'IOS', 'WINDOWS', 'MACOS', 'LINUX'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('security.screen_lock');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    // Explicit false means lock is disabled
    if (ev.value === false) {
      const dimensions: RiskDimensions = {
        severity: 4, // HIGH
        impact: 4,
        likelihood: 4,
        exposure: 4,
        assetCriticality: 4,
        controlGap: 5,
      };

      return {
        ruleId: 'SEC-SYS-SCREEN-LOCK',
        rulesetVersion: RULESET_VERSION,
        category: 'DEVICE',
        title: 'Device Screen Lock Disabled',
        description: 'Physical security check verified that no secure screen lock (PIN, password, or pattern) is configured.',
        severity: 'HIGH',
        dimensions,
        assetKey: 'keyguard',
        evidence: [
          {
            checkId: ev.checkId,
            checkName: ev.checkName,
            value: ev.value,
            source: ev.source,
            trustState: ev.trustState,
          },
        ],
        explanation: 'Without a configured screen lock, anyone with physical access to the device can freely read personal messages, access stored credentials, and modify security settings.',
        recommendation: {
          title: 'Configure Secure Screen Lock',
          description: 'Open device Security settings and set up a PIN, strong password, or pattern lock with biometric authentication.',
          actionUrl: 'settings://security',
        },
      };
    }

    return null;
  },
};

/**
 * 2. Device Storage Encryption Inactive / Not Adequately Protected
 */
export const ruleStorageEncryption: SecurityRule = {
  ruleId: 'SEC-SYS-STORAGE-ENCRYPTION',
  rulesetVersion: RULESET_VERSION,
  category: 'DEVICE',
  title: 'Device Storage Encryption Disabled',
  description: 'Internal device storage is not encrypted, leaving stored files vulnerable to offline extraction.',
  defaultSeverity: 'CRITICAL',
  requiredCheckIds: ['security.storage_encryption'],
  platformApplicability: ['ANDROID', 'IOS', 'WINDOWS', 'MACOS', 'LINUX'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('security.storage_encryption');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    // Android: ENCRYPTION_STATUS_INACTIVE=1, ENCRYPTION_STATUS_UNSUPPORTED=0
    const isInsecure =
      ev.value === 1 ||
      ev.value === 0 ||
      ev.value === 'inactive' ||
      ev.value === 'unsupported' ||
      ev.value === false;

    if (isInsecure) {
      const dimensions: RiskDimensions = {
        severity: 5, // CRITICAL
        impact: 5,
        likelihood: 3,
        exposure: 4,
        assetCriticality: 5,
        controlGap: 5,
      };

      return {
        ruleId: 'SEC-SYS-STORAGE-ENCRYPTION',
        rulesetVersion: RULESET_VERSION,
        category: 'DEVICE',
        title: 'Device Storage Encryption Disabled',
        description: 'Storage encryption is not active on this device.',
        severity: 'CRITICAL',
        dimensions,
        assetKey: 'storage',
        evidence: [
          {
            checkId: ev.checkId,
            checkName: ev.checkName,
            value: ev.value,
            source: ev.source,
            trustState: ev.trustState,
          },
        ],
        explanation: 'Unencrypted storage allows attackers with physical or recovery-mode access to read all user files, photos, database records, and app data directly from flash memory.',
        recommendation: {
          title: 'Enable Device Storage Encryption',
          description: 'Navigate to Security & Privacy settings to encrypt phone storage and protect files against offline physical extraction.',
          actionUrl: 'settings://security/encryption',
        },
      };
    }

    return null;
  },
};

/**
 * 3. Security Patch Significantly Outdated
 * Thresholds:
 * <= 30 days: no finding
 * 31–90 days: MEDIUM
 * > 90 days: HIGH
 */
export const ruleSecurityPatch: SecurityRule = {
  ruleId: 'SEC-SYS-SECURITY-PATCH',
  rulesetVersion: RULESET_VERSION,
  category: 'SYSTEM',
  title: 'Operating System Security Patch Outdated',
  description: 'The operating system security patch level is behind current security updates.',
  defaultSeverity: 'MEDIUM',
  requiredCheckIds: ['os.security_patch'],
  platformApplicability: ['ANDROID'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('os.security_patch');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    const patchStr = typeof ev.value === 'string' ? ev.value.trim() : '';
    if (!patchStr || !/^\d{4}-\d{2}-\d{2}$/.test(patchStr)) {
      return null;
    }

    const patchDate = new Date(`${patchStr}T00:00:00Z`);
    if (isNaN(patchDate.getTime())) return null;

    const evalDate = context.evaluationDate ?? new Date();
    const diffDays = Math.floor((evalDate.getTime() - patchDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return null;
    }

    const isHigh = diffDays > 90;
    const severity: EngineSeverity = isHigh ? 'HIGH' : 'MEDIUM';

    const dimensions: RiskDimensions = isHigh
      ? { severity: 4, impact: 4, likelihood: 4, exposure: 4, assetCriticality: 4, controlGap: 4 }
      : { severity: 3, impact: 3, likelihood: 3, exposure: 3, assetCriticality: 4, controlGap: 3 };

    return {
      ruleId: 'SEC-SYS-SECURITY-PATCH',
      rulesetVersion: RULESET_VERSION,
      category: 'SYSTEM',
      title: isHigh ? 'Security Patch Over 90 Days Outdated' : 'Security Patch Over 30 Days Outdated',
      description: `Security patch level (${patchStr}) is ${diffDays} days behind reference date.`,
      severity,
      dimensions,
      assetKey: 'os_patch',
      evidence: [
        {
          checkId: ev.checkId,
          checkName: ev.checkName,
          value: ev.value,
          source: ev.source,
          trustState: ev.trustState,
        },
      ],
      explanation: `Known vulnerabilities disclosed in public Android Security Bulletins remain unpatched on this device when patch levels are ${diffDays} days behind.`,
      recommendation: {
        title: 'Check for System Updates',
        description: 'Open System Settings → System Update and install any pending security patches provided by the manufacturer.',
        actionUrl: 'settings://system/update',
      },
    };
  },
};

/**
 * 4. Developer / USB Debugging Enabled
 * Emulator-aware: distinguishes physical device compromise risk from emulator development ADB.
 */
export const ruleDeveloperOptions: SecurityRule = {
  ruleId: 'SEC-SYS-DEV-DEBUGGING',
  rulesetVersion: RULESET_VERSION,
  category: 'SYSTEM',
  title: 'USB Debugging (ADB) Enabled',
  description: 'Android Debug Bridge (ADB) or Developer Settings are active.',
  defaultSeverity: 'MEDIUM',
  requiredCheckIds: ['security.adb_debugging', 'security.developer_options'],
  platformApplicability: ['ANDROID'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const adbEv = context.evidenceMap.get('security.adb_debugging');
    const devEv = context.evidenceMap.get('security.developer_options');

    const adbActive = adbEv && isEvidenceEligibleForFinding(adbEv.trustState) && adbEv.value === true;
    const devActive = devEv && isEvidenceEligibleForFinding(devEv.trustState) && devEv.value === true;

    if (!adbActive && !devActive) return null;

    const isEmulator = Boolean(context.deviceInfo.isEmulator);

    const severity: EngineSeverity = isEmulator ? 'LOW' : 'MEDIUM';
    const dimensions: RiskDimensions = isEmulator
      ? { severity: 2, impact: 2, likelihood: 2, exposure: 2, assetCriticality: 2, controlGap: 2 }
      : { severity: 3, impact: 3, likelihood: 3, exposure: 3, assetCriticality: 3, controlGap: 3 };

    const activeEv = adbActive ? adbEv! : devEv!;

    return {
      ruleId: 'SEC-SYS-DEV-DEBUGGING',
      rulesetVersion: RULESET_VERSION,
      category: 'SYSTEM',
      title: isEmulator ? 'USB Debugging Active (Emulator Environment)' : 'USB Debugging (ADB) Enabled',
      description: isEmulator
        ? 'USB Debugging is enabled in an emulator/development environment.'
        : 'USB Debugging is actively enabled on a physical device, permitting external shell access.',
      severity,
      dimensions,
      assetKey: 'adb',
      evidence: [
        {
          checkId: activeEv.checkId,
          checkName: activeEv.checkName,
          value: activeEv.value,
          source: activeEv.source,
          trustState: activeEv.trustState,
        },
      ],
      explanation: isEmulator
        ? 'ADB is active on a virtual development emulator. While normal for development, ADB should remain disabled on daily driver devices.'
        : 'USB Debugging allows connected computers to install arbitrary packages, read application databases, and bypass user confirmations via ADB commands.',
      recommendation: {
        title: isEmulator ? 'Development ADB Notice' : 'Disable USB Debugging',
        description: isEmulator
          ? 'No action required in development; disable ADB if using for production testing.'
          : 'Open Developer Options in Settings and toggle USB Debugging off when not in active development.',
        actionUrl: 'settings://developer_options',
      },
    };
  },
};

/**
 * 5. Unknown-Source Installation Risk
 */
export const ruleUnknownSources: SecurityRule = {
  ruleId: 'SEC-SYS-UNKNOWN-SOURCES',
  rulesetVersion: RULESET_VERSION,
  category: 'SYSTEM',
  title: 'Installation from Unknown Sources Permitted',
  description: 'Device configuration allows installing applications from non-market sources.',
  defaultSeverity: 'MEDIUM',
  requiredCheckIds: ['security.unknown_sources'],
  platformApplicability: ['ANDROID'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('security.unknown_sources');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    if (ev.value === true) {
      const dimensions: RiskDimensions = {
        severity: 3,
        impact: 3,
        likelihood: 3,
        exposure: 3,
        assetCriticality: 3,
        controlGap: 4,
      };

      return {
        ruleId: 'SEC-SYS-UNKNOWN-SOURCES',
        rulesetVersion: RULESET_VERSION,
        category: 'SYSTEM',
        title: 'Installation from Unknown Sources Permitted',
        description: 'Device settings allow installation of APKs outside official app stores.',
        severity: 'MEDIUM',
        dimensions,
        assetKey: 'unknown_sources',
        evidence: [
          {
            checkId: ev.checkId,
            checkName: ev.checkName,
            value: ev.value,
            source: ev.source,
            trustState: ev.trustState,
          },
        ],
        explanation: 'Enabling unknown source installations increases risk of drive-by malware downloads and untrusted sideloaded software bypasses of store verification.',
        recommendation: {
          title: 'Restrict Unknown App Installations',
          description: 'Navigate to Apps & Notifications → Special App Access → Install Unknown Apps and revoke install permissions for unverified apps.',
          actionUrl: 'settings://apps/special_access/unknown_sources',
        },
      };
    }

    return null;
  },
};

/**
 * 6. Sensitive Permission Exposure in Non-System Applications
 * Conservative rule: Only flags high-risk permission combinations on non-system apps
 * without labeling them malicious.
 */
export const HIGH_RISK_PERMISSIONS = [
  'android.permission.READ_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.SEND_SMS',
  'android.permission.READ_CALL_LOG',
  'android.permission.PROCESS_OUTGOING_CALLS',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
];

export const ruleSensitiveAppPermissions: SecurityRule = {
  ruleId: 'SEC-APP-SENSITIVE-PERMISSIONS',
  rulesetVersion: RULESET_VERSION,
  category: 'APPLICATIONS',
  title: 'Sensitive Permission Exposure in Installed Application',
  description: 'A third-party application holds high-risk permissions such as SMS, Call Log, or Window Overlays.',
  defaultSeverity: 'MEDIUM',
  requiredCheckIds: ['apps.inventory'],
  platformApplicability: ['ANDROID'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('apps.inventory');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    const value = ev.value as any;
    const apps = Array.isArray(value?.applications) ? value.applications : [];

    // Find non-system apps with high risk permissions
    const flaggedApps: Array<{ name: string; packageName: string; sensitivePerms: string[] }> = [];

    for (const app of apps) {
      if (app.isSystemApp) continue;

      const perms: string[] = [
        ...(app.grantedPermissions || []),
        ...(app.requestedPermissions || []),
      ];

      const sensitivePerms = perms.filter((p) => HIGH_RISK_PERMISSIONS.includes(p));
      if (sensitivePerms.length >= 2) {
        flaggedApps.push({
          name: app.name || app.packageName,
          packageName: app.packageName,
          sensitivePerms,
        });
      }
    }

    if (flaggedApps.length === 0) return null;

    const first = flaggedApps[0]!;
    const dimensions: RiskDimensions = {
      severity: 3,
      impact: 3,
      likelihood: 3,
      exposure: 3,
      assetCriticality: 3,
      controlGap: 3,
    };

    return {
      ruleId: 'SEC-APP-SENSITIVE-PERMISSIONS',
      rulesetVersion: RULESET_VERSION,
      category: 'APPLICATIONS',
      title: `${flaggedApps.length} Application(s) Hold Sensitive Permissions`,
      description: `Applications including ${first.name} (${first.packageName}) hold sensitive permissions: ${first.sensitivePerms.slice(0, 2).join(', ')}.`,
      severity: 'MEDIUM',
      dimensions,
      assetKey: `apps_perm_${flaggedApps.length}`,
      evidence: [
        {
          checkId: ev.checkId,
          checkName: ev.checkName,
          value: { flaggedAppsCount: flaggedApps.length, samples: flaggedApps.slice(0, 3) },
          source: ev.source,
          trustState: ev.trustState,
        },
      ],
      explanation: 'Applications with SMS or Call Log access can read one-time authentication codes or track user communications. While legitimate apps may need these, permissions should be audited periodically.',
      recommendation: {
        title: 'Review Application Permissions',
        description: 'Review granted permissions in Settings → Privacy → Permission Manager and revoke SMS or Call permissions from non-essential apps.',
        actionUrl: 'settings://privacy/permissions',
      },
    };
  },
};

/**
 * 7. Sideloaded / Non-Store Application Installed
 */
export const ruleSideloadedApps: SecurityRule = {
  ruleId: 'SEC-APP-SIDELOADED',
  rulesetVersion: RULESET_VERSION,
  category: 'APPLICATIONS',
  title: 'Non-Store Application Installed',
  description: 'One or more applications were installed from an untrusted or manual package installer.',
  defaultSeverity: 'LOW',
  requiredCheckIds: ['apps.inventory'],
  platformApplicability: ['ANDROID'],
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult | null {
    const ev = context.evidenceMap.get('apps.inventory');
    if (!ev || !isEvidenceEligibleForFinding(ev.trustState)) {
      return null;
    }

    const value = ev.value as any;
    const apps = Array.isArray(value?.applications) ? value.applications : [];

    const sideloaded = apps.filter((app: any) => {
      if (app.isSystemApp) return false;
      const source = app.installSource;
      // Sources other than Google Play Store
      return (
        source &&
        source !== 'com.android.vending' &&
        source !== 'com.google.android.feedback'
      );
    });

    if (sideloaded.length === 0) return null;

    const dimensions: RiskDimensions = {
      severity: 2,
      impact: 2,
      likelihood: 2,
      exposure: 2,
      assetCriticality: 3,
      controlGap: 2,
    };

    return {
      ruleId: 'SEC-APP-SIDELOADED',
      rulesetVersion: RULESET_VERSION,
      category: 'APPLICATIONS',
      title: `${sideloaded.length} Sideloaded / Non-Store App(s) Installed`,
      description: `Applications installed from sources other than official app stores were detected.`,
      severity: 'LOW',
      dimensions,
      assetKey: `sideloaded_${sideloaded.length}`,
      evidence: [
        {
          checkId: ev.checkId,
          checkName: ev.checkName,
          value: { count: sideloaded.length, samplePackages: sideloaded.slice(0, 3).map((a: any) => a.packageName) },
          source: ev.source,
          trustState: ev.trustState,
        },
      ],
      explanation: 'Sideloaded applications do not receive automated Google Play Protect malware scanning and may not receive regular security updates from the developer.',
      recommendation: {
        title: 'Audit Sideloaded Applications',
        description: 'Verify the authenticity and developers of manually installed applications.',
      },
    };
  },
};

/** Complete initial rule catalog */
export const SECURITY_RULES: SecurityRule[] = [
  ruleScreenLock,
  ruleStorageEncryption,
  ruleSecurityPatch,
  ruleDeveloperOptions,
  ruleUnknownSources,
  ruleSensitiveAppPermissions,
  ruleSideloadedApps,
];
