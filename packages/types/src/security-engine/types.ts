/**
 * Sentinel Phase 5: Security Engine Domain Types & Contracts.
 */

import type { DevicePlatform } from '../index';

/** Canonical 6 Security Categories per PRD & Phase 5 specifications */
export type CanonicalCategory =
  'DEVICE' | 'APPLICATIONS' | 'ACCOUNTS' | 'PRIVACY' | 'NETWORK' | 'SYSTEM';

export type CanonicalCategoryKey =
  'device' | 'applications' | 'accounts' | 'privacy' | 'network' | 'system';

/** Severity model: CRITICAL=5, HIGH=4, MEDIUM=3, LOW=2 */
export type EngineSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskPriorityBand = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FindingLifecycleState = 'ACTIVE' | 'RESOLVED' | 'MUTED';

/** Risk dimensions normalized to 1–5 scale */
export interface RiskDimensions {
  severity: number; // S (2 to 5)
  impact: number; // I (1 to 5)
  likelihood: number; // L (1 to 5)
  exposure: number; // E (1 to 5)
  assetCriticality: number; // A (1 to 5)
  controlGap: number; // C (1 to 5)
}

/** Risk calculation result */
export interface RiskCalculationResult {
  rawRisk: number; // 0–100 before confidence
  riskScore: number; // 0–100 after confidence adjustment
  priority: RiskPriorityBand;
  confidence: number; // 0.00 to 1.00
  riskModelVersion: string;
}

/** Security Rule definition */
export interface SecurityRule {
  ruleId: string;
  rulesetVersion: string;
  category: CanonicalCategory;
  title: string;
  description: string;
  defaultSeverity: EngineSeverity;
  requiredCheckIds: string[];
  platformApplicability: DevicePlatform[];
  evaluate: (context: RuleEvaluationContext) => RuleEvaluationResult | null;
}

export interface RuleEvaluationContext {
  evidenceMap: Map<string, import('../index').EvidenceItem>;
  deviceInfo: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    securityPatch?: string | null;
    isEmulator?: boolean;
    platform: DevicePlatform;
  };
  evaluationDate?: Date; // Defaults to now, deterministic in tests
}

export interface RuleEvaluationResult {
  ruleId: string;
  rulesetVersion: string;
  category: CanonicalCategory;
  title: string;
  description: string;
  severity: EngineSeverity;
  dimensions: RiskDimensions;
  assetKey?: string;
  evidence: Array<{
    checkId: string;
    checkName: string;
    value: unknown;
    source: string;
    trustState: import('../index').DataTrustState;
  }>;
  explanation: string;
  recommendation: {
    title: string;
    description: string;
    actionUrl?: string;
  };
}

/** Finding entity */
export interface EngineFinding {
  id?: string;
  fingerprint: string;
  scanId?: string;
  deviceId?: string;
  ruleId: string;
  rulesetVersion: string;
  category: CanonicalCategory;
  title: string;
  description: string;
  severity: EngineSeverity;
  status: FindingLifecycleState;
  source: string;
  platform: DevicePlatform;
  confidence: number;
  riskScore: number;
  priority: RiskPriorityBand;
  rawRisk: number;
  dimensions: RiskDimensions;
  evidence: unknown;
  explanation: string;
  recommendationText: string;
  assetKey?: string;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Finding contribution to category / overall score */
export interface FindingContribution {
  findingId?: string;
  fingerprint: string;
  ruleId: string;
  category: CanonicalCategory;
  severity: EngineSeverity;
  riskScore: number;
  basePenalty: number;
  penalty: number;
  title: string;
}

/** Category evaluation score */
export interface CategoryScoreResult {
  category: CanonicalCategory;
  categoryKey: CanonicalCategoryKey;
  score: number;
  status: 'SECURE' | 'ATTENTION' | 'CRITICAL';
  statusLabel: string;
  evaluatedControls: number;
  findingCount: number;
  totalPenalty: number;
  findings: EngineFinding[];
}

/** Score breakdown for complete explainability */
export interface ScoreBreakdown {
  score: number | null;
  scoreVersion: string;
  calculatedAt: string;
  evaluatedControlCount: number;
  unavailableCheckCount: number;
  coverageRatio: number;
  categoryScores: Record<CanonicalCategory, CategoryScoreResult>;
  findingContributions: FindingContribution[];
  rulesetVersion: string;
  riskModelVersion: string;
}

/** Engine recommendation item */
export interface EngineRecommendation {
  id?: string;
  findingFingerprint?: string;
  findingId?: string;
  ruleId: string;
  category: CanonicalCategory;
  title: string;
  description: string;
  priority: RiskPriorityBand;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  actionUrl?: string;
  createdAt?: string;
}

/** Security History record */
export interface SecurityHistoryRecord {
  id?: string;
  scanId: string;
  deviceId: string;
  recordedAt: string;
  overallScore: number | null;
  categoryScores: Record<CanonicalCategory, number>;
  findingCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  evaluatedControls: number;
  unavailableChecks: number;
  coverage: number;
  status: string;
  trend: 'IMPROVING' | 'DECLINING' | 'UNCHANGED' | 'INITIAL';
  scoreDelta?: number;
}

/** Security Event item */
export interface SecurityEventRecord {
  id?: string;
  deviceId: string;
  scanId?: string;
  findingFingerprint?: string;
  type:
    'NEW_FINDING' | 'RESOLVED_FINDING' | 'SEVERITY_CHANGED' | 'SCORE_CHANGED' | 'CONTROL_CHANGED';
  title: string;
  description: string;
  severity?: EngineSeverity;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/** Complete Structured Scan Report */
export interface CompleteScanReport {
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
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';
  summary: string;
  checksAttempted: number;
  checksCompleted: number;
  checksUnavailable: number;
  coverageRatio: number;
  overallScore: number | null;
  scoreBreakdown: ScoreBreakdown;
  categoryScores: Record<CanonicalCategory, CategoryScoreResult>;
  findings: EngineFinding[];
  findingCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recommendations: EngineRecommendation[];
  historyContext: {
    previousScore: number | null;
    trend: 'IMPROVING' | 'DECLINING' | 'UNCHANGED' | 'INITIAL';
    scoreDelta?: number;
  };
  events: SecurityEventRecord[];
  errorsOrLimitations: string[];
  rulesetVersion: string;
  riskModelVersion: string;
}
