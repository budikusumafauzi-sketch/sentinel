/**
 * Sentinel Phase 5: Security Finding Lifecycle & Deterministic Fingerprint (Section 17).
 *
 * A finding fingerprint is stable across scans and does NOT include volatile timestamps.
 * Formula: `${ruleId}#${deviceId}#${assetKey || 'device'}#${platform}`
 */

import type { DevicePlatform } from '../index';
import type { EngineFinding } from './types';

/**
 * Computes deterministic finding fingerprint.
 */
export function computeFindingFingerprint(
  ruleId: string,
  deviceId: string,
  assetKey: string = 'device',
  platform: DevicePlatform = 'ANDROID',
): string {
  const cleanRule = (ruleId || '').trim();
  const cleanDevice = (deviceId || '').trim();
  const cleanAsset = (assetKey || 'device').trim();
  const cleanPlatform = (platform || 'ANDROID').trim();

  return `${cleanRule}#${cleanDevice}#${cleanAsset}#${cleanPlatform}`;
}

/**
 * Reconciles current scan findings with previous active findings:
 * - Findings present in current scan remain/become ACTIVE.
 * - Findings previously ACTIVE whose security control was re-evaluated but condition no longer matches become RESOLVED.
 * - Findings whose checks were NOT evaluated (e.g. skipped or unavailable) maintain their previous state.
 */
export function reconcileFindingLifecycle(
  currentFindings: EngineFinding[],
  previousActiveFindings: EngineFinding[],
  evaluatedRuleIds: Set<string>,
): EngineFinding[] {
  const currentFingerprints = new Set(currentFindings.map((f) => f.fingerprint));
  const reconciled: EngineFinding[] = [...currentFindings];

  for (const prev of previousActiveFindings) {
    if (!currentFingerprints.has(prev.fingerprint)) {
      // If the rule was actually evaluated in this scan and did not fire, resolve the finding
      if (evaluatedRuleIds.has(prev.ruleId)) {
        reconciled.push({
          ...prev,
          status: 'RESOLVED',
          resolvedAt: new Date().toISOString(),
        });
      } else {
        // Rule was not evaluated in this scan — preserve state
        reconciled.push(prev);
      }
    }
  }

  return reconciled;
}
