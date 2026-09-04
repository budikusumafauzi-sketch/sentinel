/**
 * Sentinel Phase 7: AI Intelligence & Structured Schemas.
 *
 * Centralized, strongly-typed contracts for Sentinel AI operations.
 * CRITICAL PRINCIPLE: Deterministic engine remains authoritative for scores,
 * findings, and severity. AI is strictly an explanation and interpretation layer.
 */

// ──────────────────────────────────────────
// Prompt Versions
// ──────────────────────────────────────────

export const PROMPT_VERSIONS = {
  SECURITY_EXPLANATION: 'SECURITY_EXPLANATION_V1',
  SECURITY_ADVISOR: 'SECURITY_ADVISOR_V1',
  THREAT_ANALYZER: 'THREAT_ANALYZER_V1',
  SCREENSHOT_ANALYZER: 'SCREENSHOT_ANALYZER_V1',
  MESSAGE_ANALYZER: 'MESSAGE_ANALYZER_V1',
  URL_ANALYZER: 'URL_ANALYZER_V1',
} as const;

export type PromptVersion = (typeof PROMPT_VERSIONS)[keyof typeof PROMPT_VERSIONS];

// ──────────────────────────────────────────
// AI Provenance & Metadata
// ──────────────────────────────────────────

export interface AiModelMetadata {
  provider: string;
  model: string;
  tokensUsed?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AiProvenance {
  /** Indicates whether the underlying source evidence was verified by Sentinel engine */
  sourceEvidenceVerified: boolean;
  /** Always true: deterministic engine remains strictly authoritative */
  deterministicEngineAuthoritative: true;
  /** Always true: indicates this is an AI-generated explanation, not engine truth */
  aiInterpretationOnly: true;
  /** ISO timestamp of when the AI result was generated */
  generatedAt: string;
}

// ──────────────────────────────────────────
// Schema A: Security Explanation
// ──────────────────────────────────────────

export interface SecurityExplanationResult {
  findingId: string;
  summary: string;
  explanation: string;
  whyItMatters: string;
  evidenceReferences: string[];
  impact: string;
  remediation: string;
  limitations: string[];
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Schema B: Security Advisor
// ──────────────────────────────────────────

export interface AdvisorRecommendationItem {
  recommendation: string;
  rationale: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedFindingId?: string;
  affectedControl?: string;
  evidenceReferences: string[];
  steps: string[];
  limitations: string[];
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
}

export interface SecurityAdvisorResult {
  recommendations: AdvisorRecommendationItem[];
  overallGuidance: string;
  priorityRationale: string;
  limitations: string[];
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Schema C: Threat Analyzer
// ──────────────────────────────────────────

export type ThreatClassification = 'BENIGN' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';

export interface ThreatAnalyzerResult {
  classification: ThreatClassification;
  riskInterpretation: string;
  indicators: string[];
  explanation: string;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  evidence: string[];
  limitations: string[];
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Schema D: Screenshot Analyzer
// ──────────────────────────────────────────

export interface ScreenshotAnalyzerResult {
  detectedElements: string[];
  suspiciousIndicators: string[];
  explanation: string;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  limitations: string[];
  /** Explicit statement whether the image content/resolution was sufficient */
  isContentSufficient: boolean;
  recommendedAction: string;
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Schema E: Message Analyzer
// ──────────────────────────────────────────

export type MessageClassification = 'SAFE' | 'SUSPICIOUS' | 'PHISHING' | 'SPAM' | 'UNKNOWN';

export interface MessageAnalyzerResult {
  classification: MessageClassification;
  suspiciousIndicators: string[];
  explanation: string;
  urgencyTacticsDetected: boolean;
  credentialHarvestingRisk: boolean;
  recommendedAction: string;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  limitations: string[];
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Schema F: URL Analysis Orchestration
// ──────────────────────────────────────────

export type UrlRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface UrlAnalysisResult {
  normalizedUrl: string;
  domain: string;
  protocol: string;
  observations: string[];
  riskInterpretation: string;
  riskLevel: UrlRiskLevel;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  limitations: string[];
  sourceAttribution: string;
  promptVersion: string;
  modelMetadata: AiModelMetadata;
  provenance: AiProvenance;
}

// ──────────────────────────────────────────
// Error & Failure Classification
// ──────────────────────────────────────────

export type AiErrorCode =
  | 'CONFIG_MISSING'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'PROVIDER_UNAVAILABLE'
  | 'INVALID_PROVIDER_RESPONSE'
  | 'SCHEMA_VALIDATION_FAILURE'
  | 'UNSUPPORTED_REQUEST'
  | 'CONTENT_REJECTED'
  | 'INPUT_INVALID';

export interface AiErrorDetails {
  code: AiErrorCode;
  message: string;
  retryable: boolean;
  limitations: string[];
  details?: Record<string, unknown>;
}

export interface AiFailureResponse {
  success: false;
  error: AiErrorDetails;
  promptVersion?: string;
  timestamp: string;
}

// ──────────────────────────────────────────
// AI Request DTO Types
// ──────────────────────────────────────────

export interface ExplainFindingRequest {
  findingId: string;
}

export interface SecurityAdvisorRequest {
  deviceId: string;
}

export interface ThreatAnalysisRequest {
  threatInput: string;
  context?: string;
}

export interface MessageAnalysisRequest {
  messageText: string;
  sender?: string;
}

export interface UrlAnalysisRequest {
  url: string;
}

export interface ScreenshotAnalysisRequest {
  /** Base64-encoded image data */
  imageBase64: string;
  /** MIME type, e.g. image/png, image/jpeg */
  mimeType: string;
  contextNote?: string;
}
