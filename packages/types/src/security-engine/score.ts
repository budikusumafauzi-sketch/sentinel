/**
 * Sentinel Phase 5: Deterministic Security Score Engine (Section 14 & 15).
 *
 * Scoring Version:
 * - scoreVersion = "1.0.0"
 */

import type {
  CanonicalCategory,
  CanonicalCategoryKey,
  CategoryScoreResult,
  EngineFinding,
  EngineSeverity,
  FindingContribution,
  ScoreBreakdown,
} from './types';
import { RISK_MODEL_VERSION } from './risk';

export const SCORE_MODEL_VERSION = '1.0.0';

/**
 * Base Penalties per Finding Severity (Section 14):
 * CRITICAL base penalty = 40
 * HIGH base penalty = 25
 * MEDIUM base penalty = 12
 * LOW base penalty = 5
 */
export const BASE_PENALTIES: Record<EngineSeverity, number> = {
  CRITICAL: 40,
  HIGH: 25,
  MEDIUM: 12,
  LOW: 5,
};

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  'DEVICE',
  'APPLICATIONS',
  'ACCOUNTS',
  'PRIVACY',
  'NETWORK',
  'SYSTEM',
];

export const CATEGORY_KEY_MAP: Record<CanonicalCategory, CanonicalCategoryKey> = {
  DEVICE: 'device',
  APPLICATIONS: 'applications',
  ACCOUNTS: 'accounts',
  PRIVACY: 'privacy',
  NETWORK: 'network',
  SYSTEM: 'system',
};

/**
 * Normalizes any category string to a CanonicalCategory.
 */
export function toCanonicalCategory(category: string): CanonicalCategory {
  const upper = (category || '').toUpperCase().trim();
  if (upper === 'DEVICE') return 'DEVICE';
  if (upper === 'APPLICATIONS' || upper === 'APPLICATION' || upper === 'APPS')
    return 'APPLICATIONS';
  if (upper === 'ACCOUNTS' || upper === 'ACCOUNT') return 'ACCOUNTS';
  if (upper === 'PRIVACY') return 'PRIVACY';
  if (upper === 'NETWORK') return 'NETWORK';
  if (
    upper === 'SYSTEM' ||
    upper === 'OS' ||
    upper === 'UPDATE' ||
    upper === 'CONFIGURATION' ||
    upper === 'ENCRYPTION' ||
    upper === 'AUTHENTICATION'
  ) {
    return 'SYSTEM';
  }
  return 'DEVICE';
}

export function getCategoryStatus(score: number): 'SECURE' | 'ATTENTION' | 'CRITICAL' {
  if (score >= 80) return 'SECURE';
  if (score >= 50) return 'ATTENTION';
  return 'CRITICAL';
}

export function getCategoryStatusLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Attention Needed';
  return 'Critical Action Required';
}

/**
 * Calculates category score and finding penalties (Section 14):
 *
 * For each category with at least one evaluated security control:
 * Start categoryScore = 100.
 * findingPenalty = basePenalty * (riskScore / 100)
 * categoryScore = max(0, round(100 - sum(findingPenalty)))
 */
export function calculateCategoryScore(
  category: CanonicalCategory,
  findings: EngineFinding[],
  evaluatedControls: number,
): { categoryScore: CategoryScoreResult; contributions: FindingContribution[] } {
  const categoryKey = CATEGORY_KEY_MAP[category];
  const relevantFindings = findings.filter((f) => f.category === category && f.status === 'ACTIVE');

  let totalPenalty = 0;
  const contributions: FindingContribution[] = [];

  for (const f of relevantFindings) {
    const basePenalty = BASE_PENALTIES[f.severity] ?? 5;
    const penalty = Math.round(basePenalty * (f.riskScore / 100) * 100) / 100;
    totalPenalty += penalty;

    contributions.push({
      findingId: f.id,
      fingerprint: f.fingerprint,
      ruleId: f.ruleId,
      category,
      severity: f.severity,
      riskScore: f.riskScore,
      basePenalty,
      penalty,
      title: f.title,
    });
  }

  // If zero evaluated controls, category score is 100 baseline but not counted in overall score
  const score = evaluatedControls > 0 ? Math.max(0, Math.round(100 - totalPenalty)) : 100;

  const result: CategoryScoreResult = {
    category,
    categoryKey,
    score,
    status: getCategoryStatus(score),
    statusLabel: getCategoryStatusLabel(score),
    evaluatedControls,
    findingCount: relevantFindings.length,
    totalPenalty: Math.round(totalPenalty * 100) / 100,
    findings: relevantFindings,
  };

  return { categoryScore: result, contributions };
}

/**
 * Calculates Overall Security Score and Full Traceability Breakdown (Section 14 & 15).
 *
 * Requirements:
 * - Weighted average of category scores using evaluated controls as weight.
 * - Categories with 0 evaluated controls are excluded from weighting.
 * - If 0 total evaluated controls: score = null (unavailable/insufficient coverage, never 100).
 * - Complete breakdown of contributions.
 */
export function calculateSecurityScore(
  findings: EngineFinding[],
  evaluatedControlsPerCategory: Record<CanonicalCategory, number>,
  unavailableCheckCount: number = 0,
  rulesetVersion: string = '1.0.0',
): ScoreBreakdown {
  const categoryScores = {} as Record<CanonicalCategory, CategoryScoreResult>;
  const allContributions: FindingContribution[] = [];

  let weightedSum = 0;
  let totalEvaluatedControls = 0;

  for (const cat of CANONICAL_CATEGORIES) {
    const evaluated = evaluatedControlsPerCategory[cat] ?? 0;
    const { categoryScore, contributions } = calculateCategoryScore(cat, findings, evaluated);
    categoryScores[cat] = categoryScore;
    allContributions.push(...contributions);

    if (evaluated > 0) {
      weightedSum += categoryScore.score * evaluated;
      totalEvaluatedControls += evaluated;
    }
  }

  let finalScore: number | null = null;
  if (totalEvaluatedControls > 0) {
    finalScore = Math.max(0, Math.min(100, Math.round(weightedSum / totalEvaluatedControls)));
  }

  const totalAttempted = totalEvaluatedControls + unavailableCheckCount;
  const coverageRatio =
    totalAttempted > 0 ? Math.round((totalEvaluatedControls / totalAttempted) * 100) / 100 : 0;

  return {
    score: finalScore,
    scoreVersion: SCORE_MODEL_VERSION,
    calculatedAt: new Date().toISOString(),
    evaluatedControlCount: totalEvaluatedControls,
    unavailableCheckCount,
    coverageRatio,
    categoryScores,
    findingContributions: allContributions,
    rulesetVersion,
    riskModelVersion: RISK_MODEL_VERSION,
  };
}
