/**
 * Sentinel Phase 5: Complete Structured Scan Report (Section 20).
 *
 * Supported Final Statuses:
 * - COMPLETED
 * - PARTIAL
 * - FAILED
 * - CANCELLED
 */

import type { DevicePlatform } from '../index';
import type {
  CompleteScanReport,
  EngineFinding,
  EngineRecommendation,
  ScoreBreakdown,
  SecurityEventRecord,
  SecurityHistoryRecord,
} from './types';

export interface BuildScanReportOptions {
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
  startedAt: string;
  completedAt: string;
  scoreBreakdown: ScoreBreakdown;
  findings: EngineFinding[];
  recommendations: EngineRecommendation[];
  events: SecurityEventRecord[];
  historyRecord?: SecurityHistoryRecord | null;
  previousScore?: number | null;
  errorsOrLimitations?: string[];
  status?: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
}

/**
 * Builds the complete structured scan report.
 */
export function buildCompleteScanReport(options: BuildScanReportOptions): CompleteScanReport {
  const activeFindings = options.findings.filter((f) => f.status === 'ACTIVE');

  const findingCounts = {
    critical: activeFindings.filter((f) => f.severity === 'CRITICAL').length,
    high: activeFindings.filter((f) => f.severity === 'HIGH').length,
    medium: activeFindings.filter((f) => f.severity === 'MEDIUM').length,
    low: activeFindings.filter((f) => f.severity === 'LOW').length,
    total: activeFindings.length,
  };

  const totalAttempted = options.scoreBreakdown.evaluatedControlCount + options.scoreBreakdown.unavailableCheckCount;

  // Determine final status
  let finalStatus = options.status ?? 'COMPLETED';
  if (options.scoreBreakdown.unavailableCheckCount > 0 && finalStatus === 'COMPLETED') {
    // If some checks were unavailable/permission required, it is a partial coverage scan
    finalStatus = 'PARTIAL';
  }

  const previousScore = options.previousScore ?? null;
  const currentScore = options.scoreBreakdown.score;
  let trend: 'IMPROVING' | 'DECLINING' | 'UNCHANGED' | 'INITIAL' = 'INITIAL';
  let scoreDelta: number | undefined;

  if (previousScore !== null && currentScore !== null) {
    scoreDelta = currentScore - previousScore;
    if (scoreDelta > 0) trend = 'IMPROVING';
    else if (scoreDelta < 0) trend = 'DECLINING';
    else trend = 'UNCHANGED';
  }

  const summary =
    activeFindings.length === 0
      ? 'Based on the checks available to Sentinel, no active security issues were detected.'
      : `Scan identified ${activeFindings.length} active issue(s) across ${options.scoreBreakdown.evaluatedControlCount} evaluated controls.`;

  return {
    scanId: options.scanId,
    deviceId: options.deviceId,
    deviceInfo: options.deviceInfo,
    startedAt: options.startedAt,
    completedAt: options.completedAt,
    status: finalStatus,
    summary,
    checksAttempted: totalAttempted,
    checksCompleted: options.scoreBreakdown.evaluatedControlCount,
    checksUnavailable: options.scoreBreakdown.unavailableCheckCount,
    coverageRatio: options.scoreBreakdown.coverageRatio,
    overallScore: options.scoreBreakdown.score,
    scoreBreakdown: options.scoreBreakdown,
    categoryScores: options.scoreBreakdown.categoryScores,
    findings: options.findings,
    findingCounts,
    recommendations: options.recommendations,
    historyContext: {
      previousScore,
      trend,
      scoreDelta,
    },
    events: options.events,
    errorsOrLimitations: options.errorsOrLimitations ?? [],
    rulesetVersion: options.scoreBreakdown.rulesetVersion,
    riskModelVersion: options.scoreBreakdown.riskModelVersion,
  };
}
