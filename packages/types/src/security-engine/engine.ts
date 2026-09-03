/**
 * Sentinel Phase 5: Deterministic Security Engine Orchestrator.
 *
 * Coordinates:
 * RAW / STRUCTURED EVIDENCE
 *         ↓
 * SECURITY RULE ENGINE
 *         ↓
 * FINDINGS
 *         ↓
 * RISK ENGINE
 *         ↓
 * SECURITY SCORE
 *         ↓
 * RECOMMENDATIONS
 *         ↓
 * SECURITY CATEGORIES
 *         ↓
 * SCAN REPORT
 *         ↓
 * SECURITY HISTORY
 *         ↓
 * SECURITY EVENTS
 */

import type { DevicePlatform, EvidenceItem } from '../index';
import type {
  CanonicalCategory,
  CompleteScanReport,
  EngineFinding,
  EngineRecommendation,
  RuleEvaluationContext,
  ScoreBreakdown,
  SecurityEventRecord,
  SecurityHistoryRecord,
  SecurityRule,
} from './types';
import { calculateRiskScore, TRUST_CONFIDENCE_MAP } from './risk';
import { calculateSecurityScore, CANONICAL_CATEGORIES } from './score';
import { computeFindingFingerprint, reconcileFindingLifecycle } from './lifecycle';
import { generateRecommendations } from './recommendations';
import { generateSecurityEvents, generateSecurityHistory } from './events';
import { buildCompleteScanReport } from './report';
import { RULESET_VERSION, SECURITY_RULES } from './rules';

export interface ExecuteEngineOptions {
  scanId: string;
  deviceId: string;
  deviceInfo: {
    manufacturer: string;
    model: string;
    osVersion: string;
    securityPatch?: string | null;
    isEmulator?: boolean;
    platform: DevicePlatform;
  };
  rawEvidence: EvidenceItem[];
  previousFindings?: EngineFinding[];
  previousHistory?: SecurityHistoryRecord | null;
  previousScore?: number | null;
  evaluationDate?: Date;
  rules?: SecurityRule[];
  scanStartedAt?: string;
  scanCompletedAt?: string;
}

export interface EngineExecutionResult {
  report: CompleteScanReport;
  findings: EngineFinding[];
  scoreBreakdown: ScoreBreakdown;
  recommendations: EngineRecommendation[];
  events: SecurityEventRecord[];
  historyRecord: SecurityHistoryRecord;
}

/**
 * Executes the complete deterministic security intelligence pipeline.
 */
export function executeSecurityEngine(options: ExecuteEngineOptions): EngineExecutionResult {
  const {
    scanId,
    deviceId,
    deviceInfo,
    rawEvidence,
    previousFindings = [],
    previousHistory = null,
    previousScore = null,
    evaluationDate = new Date(),
    rules = SECURITY_RULES,
    scanStartedAt = new Date().toISOString(),
    scanCompletedAt = new Date().toISOString(),
  } = options;

  // 1. Build evidence map and categorize signals
  const evidenceMap = new Map<string, EvidenceItem>();
  for (const ev of rawEvidence) {
    evidenceMap.set(ev.checkId, ev);
  }

  // Count evaluated controls vs unavailable checks per canonical category
  const evaluatedControlsPerCategory = {} as Record<CanonicalCategory, number>;
  for (const cat of CANONICAL_CATEGORIES) {
    evaluatedControlsPerCategory[cat] = 0;
  }

  let unavailableCheckCount = 0;
  const errorsOrLimitations: string[] = [];

  for (const ev of rawEvidence) {
    const trust = ev.trustState;
    if (trust === 'NOT_AVAILABLE' || trust === 'PERMISSION_REQUIRED' || trust === 'UNABLE_TO_VERIFY') {
      unavailableCheckCount++;
      if (ev.notes) {
        errorsOrLimitations.push(`${ev.checkName}: ${ev.notes}`);
      }
      continue;
    }

    // Verified / Analyzed / User-provided counts as an evaluated control
    if (ev.category === 'SYSTEM' || ev.category === 'UPDATE' || ev.category === 'CONFIGURATION') {
      evaluatedControlsPerCategory['SYSTEM'] = (evaluatedControlsPerCategory['SYSTEM'] || 0) + 1;
    } else if (ev.category === 'AUTHENTICATION' || ev.category === 'ENCRYPTION' || ev.checkId.startsWith('device.')) {
      evaluatedControlsPerCategory['DEVICE'] = (evaluatedControlsPerCategory['DEVICE'] || 0) + 1;
    } else if (ev.category === 'APPLICATION' || ev.category === 'PERMISSIONS') {
      evaluatedControlsPerCategory['APPLICATIONS'] = (evaluatedControlsPerCategory['APPLICATIONS'] || 0) + 1;
    } else if (ev.category === 'NETWORK') {
      evaluatedControlsPerCategory['NETWORK'] = (evaluatedControlsPerCategory['NETWORK'] || 0) + 1;
    } else if (ev.category === 'PRIVACY') {
      evaluatedControlsPerCategory['PRIVACY'] = (evaluatedControlsPerCategory['PRIVACY'] || 0) + 1;
    }
  }

  // 2. Evaluate rules
  const evalContext: RuleEvaluationContext = {
    evidenceMap,
    deviceInfo,
    evaluationDate,
  };

  const currentFindings: EngineFinding[] = [];
  const evaluatedRuleIds = new Set<string>();

  for (const rule of rules) {
    // Check platform applicability
    if (!rule.platformApplicability.includes(deviceInfo.platform)) {
      continue;
    }

    // Check if required evidence checks were present in this scan
    const hasRequiredChecks = rule.requiredCheckIds.some((cid) => evidenceMap.has(cid));
    if (hasRequiredChecks) {
      evaluatedRuleIds.add(rule.ruleId);
    }

    const evalResult = rule.evaluate(evalContext);
    if (evalResult) {
      const confidence = TRUST_CONFIDENCE_MAP[evalResult.evidence[0]?.trustState ?? 'VERIFIED'] ?? 1.0;
      const riskCalc = calculateRiskScore(evalResult.dimensions, confidence);
      const fingerprint = computeFindingFingerprint(
        rule.ruleId,
        deviceId,
        evalResult.assetKey || 'device',
        deviceInfo.platform,
      );

      currentFindings.push({
        fingerprint,
        ruleId: rule.ruleId,
        rulesetVersion: rule.rulesetVersion,
        category: evalResult.category,
        title: evalResult.title,
        description: evalResult.description,
        severity: evalResult.severity,
        status: 'ACTIVE',
        source: evalResult.evidence[0]?.source ?? 'Sentinel',
        platform: deviceInfo.platform,
        confidence: riskCalc.confidence,
        riskScore: riskCalc.riskScore,
        priority: riskCalc.priority,
        rawRisk: riskCalc.rawRisk,
        dimensions: evalResult.dimensions,
        evidence: evalResult.evidence,
        explanation: evalResult.explanation,
        recommendationText: evalResult.recommendation.description,
        assetKey: evalResult.assetKey,
        createdAt: scanCompletedAt,
        updatedAt: scanCompletedAt,
      });
    }
  }

  // 3. Finding Lifecycle Reconciliation
  const reconciledFindings = reconcileFindingLifecycle(
    currentFindings,
    previousFindings,
    evaluatedRuleIds,
  );

  // 4. Calculate Security Score & Breakdown
  const scoreBreakdown = calculateSecurityScore(
    reconciledFindings,
    evaluatedControlsPerCategory,
    unavailableCheckCount,
    RULESET_VERSION,
  );

  // 5. Generate Recommendations
  const recommendations = generateRecommendations(reconciledFindings);

  // 6. Generate Non-Noisy Security Events
  const events = generateSecurityEvents(
    scanId,
    deviceId,
    reconciledFindings,
    previousFindings,
    scoreBreakdown.score,
    previousScore,
  );

  // 7. Generate Security History Record
  const historyRecord = generateSecurityHistory(
    scanId,
    deviceId,
    scoreBreakdown,
    reconciledFindings,
    previousHistory,
  );

  // 8. Build Complete Scan Report
  const report = buildCompleteScanReport({
    scanId,
    deviceId,
    deviceInfo,
    startedAt: scanStartedAt,
    completedAt: scanCompletedAt,
    scoreBreakdown,
    findings: reconciledFindings,
    recommendations,
    events,
    historyRecord,
    previousScore,
    errorsOrLimitations,
  });

  return {
    report,
    findings: reconciledFindings,
    scoreBreakdown,
    recommendations,
    events,
    historyRecord,
  };
}
