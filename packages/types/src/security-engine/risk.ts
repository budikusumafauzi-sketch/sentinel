/**
 * Sentinel Phase 5: Deterministic Risk Engine & Canonical Formula (Section 10–13).
 *
 * Ruleset & Model Versioning:
 * - riskModelVersion = "1.0.0"
 */

import type {
  EngineSeverity,
  RiskCalculationResult,
  RiskDimensions,
  RiskPriorityBand,
} from './types';
import type { DataTrustState } from '../index';

export const RISK_MODEL_VERSION = '1.0.0';

/**
 * Severity Numeric Weights (Section 10):
 * CRITICAL = 5
 * HIGH = 4
 * MEDIUM = 3
 * LOW = 2
 */
export const SEVERITY_WEIGHTS: Record<EngineSeverity, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
};

/**
 * Deterministic Provenance-Based Confidence (Section 12):
 * VERIFIED = 1.00
 * ANALYZED = 0.85
 * USER_PROVIDED = 0.75
 *
 * NOT_AVAILABLE, PERMISSION_REQUIRED, UNABLE_TO_VERIFY are not eligible
 * for finding generation.
 */
export const TRUST_CONFIDENCE_MAP: Record<DataTrustState, number> = {
  VERIFIED: 1.0,
  ANALYZED: 0.85,
  USER_PROVIDED: 0.75,
  NOT_AVAILABLE: 0.0,
  PERMISSION_REQUIRED: 0.0,
  UNABLE_TO_VERIFY: 0.0,
};

/**
 * Checks whether an evidence trust state is eligible for finding generation.
 */
export function isEvidenceEligibleForFinding(trustState: DataTrustState): boolean {
  return trustState === 'VERIFIED' || trustState === 'ANALYZED';
}

/**
 * Calculates deterministic risk score using the Canonical Phase 5 formula (Section 11):
 *
 * Dimensions normalized to 1–5:
 * S = severity
 * I = impact
 * L = likelihood
 * E = exposure
 * A = asset criticality
 * C = control gap
 *
 * weighted = 0.40*S + 0.15*I + 0.15*L + 0.10*E + 0.10*A + 0.10*C
 * rawRisk = ((weighted - 1) / 4) * 100
 * riskScore = round(rawRisk * (0.70 + (0.30 * confidence)))
 * Clamped to 0–100.
 */
export function calculateRiskScore(
  dimensions: RiskDimensions,
  confidence: number = 1.0,
): RiskCalculationResult {
  const S = Math.min(5, Math.max(1, dimensions.severity));
  const I = Math.min(5, Math.max(1, dimensions.impact));
  const L = Math.min(5, Math.max(1, dimensions.likelihood));
  const E = Math.min(5, Math.max(1, dimensions.exposure));
  const A = Math.min(5, Math.max(1, dimensions.assetCriticality));
  const C = Math.min(5, Math.max(1, dimensions.controlGap));

  const rawWeighted = 0.4 * S + 0.15 * I + 0.15 * L + 0.1 * E + 0.1 * A + 0.1 * C;

  const weighted = Math.round(rawWeighted * 10000) / 10000;
  const rawRisk = Math.min(
    100,
    Math.max(0, Math.round(((weighted - 1) / 4) * 100 * 10000) / 10000),
  );

  const clampedConfidence = Math.min(1.0, Math.max(0.0, confidence));

  const confidenceFactor = 0.7 + 0.3 * clampedConfidence;
  const calculatedRisk = Math.round(rawRisk * confidenceFactor);
  const riskScore = Math.min(100, Math.max(0, calculatedRisk));

  const priority = getRiskPriorityBand(riskScore);

  return {
    rawRisk: Math.round(rawRisk * 100) / 100,
    riskScore,
    priority,
    confidence: clampedConfidence,
    riskModelVersion: RISK_MODEL_VERSION,
  };
}

/**
 * Deterministic Priority Bands (Section 13):
 * 85–100 = CRITICAL
 * 70–84  = HIGH
 * 40–69  = MEDIUM
 * 0–39   = LOW
 */
export function getRiskPriorityBand(riskScore: number): RiskPriorityBand {
  if (riskScore >= 85) return 'CRITICAL';
  if (riskScore >= 70) return 'HIGH';
  if (riskScore >= 40) return 'MEDIUM';
  return 'LOW';
}
