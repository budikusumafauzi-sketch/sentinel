/**
 * Sentinel Phase 5: Security Events & Security History Engines (Section 18 & 19).
 *
 * Requirements:
 * - Non-noisy event generation: compare current scan with previous scan of device.
 * - No events created solely for timestamp/scanId changes or unchanged evidence.
 * - History tracking: posture trend (IMPROVING, DECLINING, UNCHANGED, INITIAL).
 * - No raw sensitive evidence payloads in history.
 */

import type {
  CanonicalCategory,
  EngineFinding,
  ScoreBreakdown,
  SecurityEventRecord,
  SecurityHistoryRecord,
} from './types';
import { CANONICAL_CATEGORIES } from './score';

/**
 * Compares current scan findings and score with previous scan to generate non-noisy security events.
 */
export function generateSecurityEvents(
  currentScanId: string,
  deviceId: string,
  currentFindings: EngineFinding[],
  previousFindings: EngineFinding[],
  currentScore: number | null,
  previousScore: number | null,
): SecurityEventRecord[] {
  const events: SecurityEventRecord[] = [];
  const now = new Date().toISOString();

  const prevActiveMap = new Map<string, EngineFinding>();
  for (const f of previousFindings) {
    if (f.status === 'ACTIVE') {
      prevActiveMap.set(f.fingerprint, f);
    }
  }

  const currentActiveMap = new Map<string, EngineFinding>();
  for (const f of currentFindings) {
    if (f.status === 'ACTIVE') {
      currentActiveMap.set(f.fingerprint, f);
    }
  }

  // 1. Check for NEW findings
  for (const [fingerprint, curr] of currentActiveMap.entries()) {
    const prev = prevActiveMap.get(fingerprint);
    if (!prev) {
      events.push({
        deviceId,
        scanId: currentScanId,
        findingFingerprint: fingerprint,
        type: 'NEW_FINDING',
        title: `New Finding Detected: ${curr.title}`,
        description: `Security rule ${curr.ruleId} flagged a ${curr.severity} severity issue.`,
        severity: curr.severity,
        metadata: {
          ruleId: curr.ruleId,
          riskScore: curr.riskScore,
          category: curr.category,
        },
        createdAt: now,
      });
    } else if (prev.severity !== curr.severity || Math.abs(prev.riskScore - curr.riskScore) >= 5) {
      // 2. Check for SEVERITY / RISK changed
      events.push({
        deviceId,
        scanId: currentScanId,
        findingFingerprint: fingerprint,
        type: 'SEVERITY_CHANGED',
        title: `Finding Severity Changed: ${curr.title}`,
        description: `Risk score shifted from ${prev.riskScore} (${prev.severity}) to ${curr.riskScore} (${curr.severity}).`,
        severity: curr.severity,
        metadata: {
          ruleId: curr.ruleId,
          previousRiskScore: prev.riskScore,
          currentRiskScore: curr.riskScore,
        },
        createdAt: now,
      });
    }
  }

  // 3. Check for RESOLVED findings
  for (const [fingerprint, prev] of prevActiveMap.entries()) {
    if (!currentActiveMap.has(fingerprint)) {
      events.push({
        deviceId,
        scanId: currentScanId,
        findingFingerprint: fingerprint,
        type: 'RESOLVED_FINDING',
        title: `Issue Resolved: ${prev.title}`,
        description: `Security control for ${prev.ruleId} is now compliant.`,
        severity: prev.severity,
        metadata: {
          ruleId: prev.ruleId,
          resolvedFingerprint: fingerprint,
        },
        createdAt: now,
      });
    }
  }

  // 4. Check for SCORE CHANGED (threshold: >= 3 points change)
  if (currentScore !== null && previousScore !== null) {
    const delta = currentScore - previousScore;
    if (Math.abs(delta) >= 3) {
      events.push({
        deviceId,
        scanId: currentScanId,
        type: 'SCORE_CHANGED',
        title:
          delta > 0
            ? `Security Score Improved (+${delta} pts)`
            : `Security Score Dropped (${delta} pts)`,
        description: `Overall security posture moved from ${previousScore} to ${currentScore}.`,
        metadata: {
          previousScore,
          currentScore,
          delta,
        },
        createdAt: now,
      });
    }
  }

  return events;
}

/**
 * Builds a Security History record for historical posture tracking (Section 18).
 */
export function generateSecurityHistory(
  scanId: string,
  deviceId: string,
  scoreBreakdown: ScoreBreakdown,
  findings: EngineFinding[],
  previousHistory?: SecurityHistoryRecord | null,
): SecurityHistoryRecord {
  const recordedAt = new Date().toISOString();

  const categoryScores = {} as Record<CanonicalCategory, number>;
  for (const cat of CANONICAL_CATEGORIES) {
    categoryScores[cat] = scoreBreakdown.categoryScores[cat]?.score ?? 100;
  }

  const activeFindings = findings.filter((f) => f.status === 'ACTIVE');
  const findingCounts = {
    critical: activeFindings.filter((f) => f.severity === 'CRITICAL').length,
    high: activeFindings.filter((f) => f.severity === 'HIGH').length,
    medium: activeFindings.filter((f) => f.severity === 'MEDIUM').length,
    low: activeFindings.filter((f) => f.severity === 'LOW').length,
    total: activeFindings.length,
  };

  let trend: 'IMPROVING' | 'DECLINING' | 'UNCHANGED' | 'INITIAL' = 'INITIAL';
  let scoreDelta: number | undefined;

  if (previousHistory && previousHistory.overallScore !== null && scoreBreakdown.score !== null) {
    scoreDelta = scoreBreakdown.score - previousHistory.overallScore;
    if (scoreDelta > 0) trend = 'IMPROVING';
    else if (scoreDelta < 0) trend = 'DECLINING';
    else trend = 'UNCHANGED';
  }

  return {
    scanId,
    deviceId,
    recordedAt,
    overallScore: scoreBreakdown.score,
    categoryScores,
    findingCounts,
    evaluatedControls: scoreBreakdown.evaluatedControlCount,
    unavailableChecks: scoreBreakdown.unavailableCheckCount,
    coverage: scoreBreakdown.coverageRatio,
    status: 'COMPLETED',
    trend,
    scoreDelta,
  };
}
