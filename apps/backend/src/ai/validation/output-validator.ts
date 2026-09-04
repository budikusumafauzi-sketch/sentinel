import { Injectable, Logger } from '@nestjs/common';
import {
  SecurityExplanationResult,
  SecurityAdvisorResult,
  ThreatAnalyzerResult,
  ScreenshotAnalyzerResult,
  MessageAnalyzerResult,
  UrlAnalysisResult,
  AiErrorCode,
  AiModelMetadata,
  AiProvenance,
} from '@sentinel/types';

export class OutputValidationError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode = 'SCHEMA_VALIDATION_FAILURE',
    public readonly validationErrors: string[] = [],
  ) {
    super(message);
    this.name = 'OutputValidationError';
  }
}

@Injectable()
export class OutputValidator {
  private readonly logger = new Logger(OutputValidator.name);

  private createProvenance(sourceEvidenceVerified: boolean): AiProvenance {
    return {
      sourceEvidenceVerified,
      deterministicEngineAuthoritative: true,
      aiInterpretationOnly: true,
      generatedAt: new Date().toISOString(),
    };
  }

  private validateConfidence(
    confidence: unknown,
    errors: string[],
    fieldName = 'confidence',
  ): number {
    if (typeof confidence !== 'number' || isNaN(confidence) || confidence < 0 || confidence > 1) {
      errors.push(`${fieldName} must be a number between 0.0 and 1.0 (got ${confidence})`);
      return 0.5;
    }
    return confidence;
  }

  private validateString(
    value: unknown,
    fieldName: string,
    errors: string[],
    required = true,
  ): string {
    if (typeof value !== 'string' || (required && value.trim().length === 0)) {
      errors.push(`${fieldName} must be a non-empty string`);
      return '';
    }
    return value.trim();
  }

  private validateStringArray(value: unknown, fieldName: string, errors: string[]): string[] {
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array of strings`);
      return [];
    }
    return value.map((item, idx) => {
      if (typeof item !== 'string') {
        errors.push(`${fieldName}[${idx}] must be a string`);
        return String(item ?? '');
      }
      return item.trim();
    });
  }

  /**
   * Validate and assemble Security Explanation result.
   */
  validateSecurityExplanation(
    raw: any,
    findingId: string,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
    sourceEvidenceVerified: boolean,
  ): SecurityExplanationResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    // Protect deterministic boundary: AI must not alter scores or severities
    if ('score' in raw || 'securityScore' in raw || 'riskScore' in raw) {
      this.logger.warn('AI attempt to return security score rejected at validation boundary');
      delete raw.score;
      delete raw.securityScore;
      delete raw.riskScore;
    }

    const summary = this.validateString(raw.summary, 'summary', errors);
    const explanation = this.validateString(raw.explanation, 'explanation', errors);
    const whyItMatters = this.validateString(raw.whyItMatters, 'whyItMatters', errors);
    const impact = this.validateString(raw.impact, 'impact', errors);
    const remediation = this.validateString(raw.remediation, 'remediation', errors);
    const evidenceReferences = this.validateStringArray(
      raw.evidenceReferences,
      'evidenceReferences',
      errors,
    );
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const confidence = this.validateConfidence(raw.confidence, errors);

    if (errors.length > 0) {
      throw new OutputValidationError(
        `Security explanation schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      findingId,
      summary,
      explanation,
      whyItMatters,
      evidenceReferences,
      impact,
      remediation,
      limitations:
        limitations.length > 0 ? limitations : ['No explicit limitations provided by AI model.'],
      confidence,
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(sourceEvidenceVerified),
    };
  }

  /**
   * Validate and assemble Security Advisor result.
   */
  validateSecurityAdvisor(
    raw: any,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
    validFindingIds: Set<string>,
  ): SecurityAdvisorResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    const overallGuidance = this.validateString(raw.overallGuidance, 'overallGuidance', errors);
    const priorityRationale = this.validateString(
      raw.priorityRationale,
      'priorityRationale',
      errors,
    );
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const confidence = this.validateConfidence(raw.confidence, errors);

    if (!Array.isArray(raw.recommendations) || raw.recommendations.length === 0) {
      errors.push('recommendations must be a non-empty array');
    }

    const validatedRecommendations = (raw.recommendations || []).map((item: any, idx: number) => {
      const rec = this.validateString(
        item.recommendation,
        `recommendations[${idx}].recommendation`,
        errors,
      );
      const rationale = this.validateString(
        item.rationale,
        `recommendations[${idx}].rationale`,
        errors,
      );
      const priority = item.priority?.toUpperCase();
      if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        errors.push(
          `recommendations[${idx}].priority must be CRITICAL, HIGH, MEDIUM, or LOW (got ${item.priority})`,
        );
      }

      let affectedFindingId: string | undefined = undefined;
      if (item.affectedFindingId) {
        if (validFindingIds.size > 0 && !validFindingIds.has(item.affectedFindingId)) {
          // Reject fabricated finding ID
          this.logger.warn(`AI referenced non-existent findingId: ${item.affectedFindingId}`);
        } else {
          affectedFindingId = item.affectedFindingId;
        }
      }

      const affectedControl = item.affectedControl
        ? String(item.affectedControl).trim()
        : undefined;
      const evidenceReferences = this.validateStringArray(
        item.evidenceReferences ?? [],
        `recommendations[${idx}].evidenceReferences`,
        errors,
      );
      const steps = this.validateStringArray(
        item.steps ?? [],
        `recommendations[${idx}].steps`,
        errors,
      );
      const itemLimitations = this.validateStringArray(
        item.limitations ?? [],
        `recommendations[${idx}].limitations`,
        errors,
      );
      const itemConfidence = this.validateConfidence(
        item.confidence ?? 0.8,
        errors,
        `recommendations[${idx}].confidence`,
      );

      return {
        recommendation: rec,
        rationale,
        priority: (priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
        affectedFindingId,
        affectedControl,
        evidenceReferences,
        steps,
        limitations: itemLimitations,
        confidence: itemConfidence,
      };
    });

    if (errors.length > 0) {
      throw new OutputValidationError(
        `Security advisor schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      recommendations: validatedRecommendations,
      overallGuidance,
      priorityRationale,
      limitations:
        limitations.length > 0
          ? limitations
          : ['Based exclusively on provided active findings context.'],
      confidence,
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(true),
    };
  }

  /**
   * Validate and assemble Threat Analyzer result.
   */
  validateThreatAnalysis(
    raw: any,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
  ): ThreatAnalyzerResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    const classification = raw.classification?.toUpperCase();
    if (!['BENIGN', 'SUSPICIOUS', 'MALICIOUS', 'UNKNOWN'].includes(classification)) {
      errors.push(
        `classification must be BENIGN, SUSPICIOUS, MALICIOUS, or UNKNOWN (got ${raw.classification})`,
      );
    }

    const riskInterpretation = this.validateString(
      raw.riskInterpretation,
      'riskInterpretation',
      errors,
    );
    const explanation = this.validateString(raw.explanation, 'explanation', errors);
    const indicators = this.validateStringArray(raw.indicators, 'indicators', errors);
    const evidence = this.validateStringArray(raw.evidence, 'evidence', errors);
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const confidence = this.validateConfidence(raw.confidence, errors);

    if (errors.length > 0) {
      throw new OutputValidationError(
        `Threat analysis schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      classification: classification || 'UNKNOWN',
      riskInterpretation,
      indicators,
      explanation,
      confidence,
      evidence,
      limitations: limitations.length > 0 ? limitations : ['Pattern heuristic analysis only.'],
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(false),
    };
  }

  /**
   * Validate and assemble Screenshot Analyzer result.
   */
  validateScreenshotAnalysis(
    raw: any,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
  ): ScreenshotAnalyzerResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    const detectedElements = this.validateStringArray(
      raw.detectedElements,
      'detectedElements',
      errors,
    );
    const suspiciousIndicators = this.validateStringArray(
      raw.suspiciousIndicators,
      'suspiciousIndicators',
      errors,
    );
    const explanation = this.validateString(raw.explanation, 'explanation', errors);
    const recommendedAction = this.validateString(
      raw.recommendedAction,
      'recommendedAction',
      errors,
    );
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const confidence = this.validateConfidence(raw.confidence, errors);
    const isContentSufficient =
      typeof raw.isContentSufficient === 'boolean' ? raw.isContentSufficient : true;

    if (errors.length > 0) {
      throw new OutputValidationError(
        `Screenshot analysis schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      detectedElements,
      suspiciousIndicators,
      explanation,
      confidence,
      limitations:
        limitations.length > 0
          ? limitations
          : ['Pixel inspection only; network context unverified.'],
      isContentSufficient,
      recommendedAction,
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(false),
    };
  }

  /**
   * Validate and assemble Message Analyzer result.
   */
  validateMessageAnalysis(
    raw: any,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
  ): MessageAnalyzerResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    const classification = raw.classification?.toUpperCase();
    if (!['SAFE', 'SUSPICIOUS', 'PHISHING', 'SPAM', 'UNKNOWN'].includes(classification)) {
      errors.push(
        `classification must be SAFE, SUSPICIOUS, PHISHING, SPAM, or UNKNOWN (got ${raw.classification})`,
      );
    }

    const suspiciousIndicators = this.validateStringArray(
      raw.suspiciousIndicators,
      'suspiciousIndicators',
      errors,
    );
    const explanation = this.validateString(raw.explanation, 'explanation', errors);
    const recommendedAction = this.validateString(
      raw.recommendedAction,
      'recommendedAction',
      errors,
    );
    const urgencyTacticsDetected = Boolean(raw.urgencyTacticsDetected);
    const credentialHarvestingRisk = Boolean(raw.credentialHarvestingRisk);
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const confidence = this.validateConfidence(raw.confidence, errors);

    if (errors.length > 0) {
      throw new OutputValidationError(
        `Message analysis schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      classification: classification || 'UNKNOWN',
      suspiciousIndicators,
      explanation,
      urgencyTacticsDetected,
      credentialHarvestingRisk,
      recommendedAction,
      confidence,
      limitations: limitations.length > 0 ? limitations : ['Heuristic textual analysis only.'],
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(false),
    };
  }

  /**
   * Validate and assemble URL Analysis result.
   */
  validateUrlAnalysis(
    raw: any,
    normalizedUrl: string,
    domain: string,
    protocol: string,
    promptVersion: string,
    modelMetadata: AiModelMetadata,
  ): UrlAnalysisResult {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      throw new OutputValidationError('AI response is not an object', 'SCHEMA_VALIDATION_FAILURE');
    }

    const riskLevel = raw.riskLevel?.toUpperCase();
    if (!['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'].includes(riskLevel)) {
      errors.push(`riskLevel must be LOW, MEDIUM, HIGH, or UNKNOWN (got ${raw.riskLevel})`);
    }

    const observations = this.validateStringArray(raw.observations, 'observations', errors);
    const riskInterpretation = this.validateString(
      raw.riskInterpretation,
      'riskInterpretation',
      errors,
    );
    const limitations = this.validateStringArray(raw.limitations, 'limitations', errors);
    const sourceAttribution = this.validateString(
      raw.sourceAttribution ?? 'Sentinel AI URL Orchestrator',
      'sourceAttribution',
      errors,
    );
    const confidence = this.validateConfidence(raw.confidence, errors);

    if (errors.length > 0) {
      throw new OutputValidationError(
        `URL analysis schema validation failed: ${errors.join('; ')}`,
        'SCHEMA_VALIDATION_FAILURE',
        errors,
      );
    }

    return {
      normalizedUrl,
      domain,
      protocol,
      observations,
      riskInterpretation,
      riskLevel: riskLevel || 'UNKNOWN',
      confidence,
      limitations:
        limitations.length > 0 ? limitations : ['Phase 7 syntactic/heuristic analysis only.'],
      sourceAttribution,
      promptVersion,
      modelMetadata,
      provenance: this.createProvenance(false),
    };
  }
}
