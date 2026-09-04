import {
  Injectable,
  Inject,
  Optional,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, AiProvider } from './interfaces/ai-provider.interface';
import { PromptRegistry } from './prompts/prompt-registry';
import { OutputValidator, OutputValidationError } from './validation/output-validator';
import { GeminiProviderError } from './providers/gemini.provider';
import {
  SecurityExplanationResult,
  SecurityAdvisorResult,
  ThreatAnalyzerResult,
  ScreenshotAnalyzerResult,
  MessageAnalyzerResult,
  UrlAnalysisResult,
  AiErrorCode,
} from '@sentinel/types';
import {
  ThreatAnalysisDto,
  MessageAnalysisDto,
  UrlAnalysisDto,
  ScreenshotAnalysisDto,
} from './dto';

import { ThreatIntelService } from '../threat-intel/threat-intel.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly promptRegistry: PromptRegistry,
    private readonly outputValidator: OutputValidator,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
    @Optional() private readonly threatIntelService?: ThreatIntelService,
  ) {}

  /**
   * Check if AI provider is currently ready with credentials.
   */
  isAiAvailable(): boolean {
    return this.aiProvider.isConfigured();
  }

  /**
   * Explain a deterministic verified finding with AI contextual intelligence.
   * STRICT SECURITY BOUNDARY: Does not modify finding, severity, or score.
   */
  async explainFinding(userId: string, findingId: string): Promise<SecurityExplanationResult> {
    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        scan: true,
      },
    });

    if (!finding) {
      throw new NotFoundException(`Finding not found: ${findingId}`);
    }

    if (finding.scan.userId !== userId) {
      throw new ForbiddenException('Access denied to this finding');
    }

    // Privacy filter: extract only relevant evidence and strip sensitive tokens/guid
    const rawEvidence = (finding.evidence as any) ?? [];
    const sanitizedEvidence = this.sanitizeEvidence(rawEvidence);

    const { version, prompt } = this.promptRegistry.buildSecurityExplanationPrompt(
      {
        id: finding.id,
        title: finding.title,
        category: finding.category,
        severity: finding.severity,
        description: finding.description,
        remediation: finding.remediation,
        confidence: finding.confidence,
      },
      sanitizedEvidence,
    );

    const sourceEvidenceVerified = finding.status === 'OPEN' || finding.confidence === 1.0;

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        temperature: 0.2,
      });

      return this.outputValidator.validateSecurityExplanation(
        response.content,
        finding.id,
        version,
        {
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
        },
        sourceEvidenceVerified,
      );
    } catch (err: any) {
      this.handleAiError('explainFinding', err);
    }
  }

  /**
   * Provide prioritized Security Advisor guidance based on deterministic device findings.
   */
  async getSecurityAdvisor(userId: string, deviceId: string): Promise<SecurityAdvisorResult> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: {
        securityScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!device) {
      throw new NotFoundException(`Device not found: ${deviceId}`);
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('Access denied to this device');
    }

    // Fetch active findings for this device
    const findings = await this.prisma.finding.findMany({
      where: {
        deviceId,
        status: 'OPEN',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const validFindingIds = new Set(findings.map((f) => f.id));
    const latestScore = device.securityScores[0];
    const scoreSummary = latestScore
      ? {
          score: latestScore.overallScore,
          evaluatedControls: latestScore.evaluatedControlCount ?? 0,
          unavailableChecks: latestScore.unavailableCheckCount ?? 0,
        }
      : undefined;

    const { version, prompt } = this.promptRegistry.buildSecurityAdvisorPrompt(
      {
        platform: device.platform,
        osVersion: device.osVersion,
        model: device.model,
      },
      findings.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        category: f.category,
      })),
      scoreSummary,
    );

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        temperature: 0.2,
      });

      return this.outputValidator.validateSecurityAdvisor(
        response.content,
        version,
        {
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
        },
        validFindingIds,
      );
    } catch (err: any) {
      this.handleAiError('getSecurityAdvisor', err);
    }
  }

  /**
   * Analyze digital threat text with Threat Analyzer.
   */
  async analyzeThreat(_userId: string, dto: ThreatAnalysisDto): Promise<ThreatAnalyzerResult> {
    const sanitizedInput = this.sanitizeText(dto.threatInput);
    const sanitizedContext = dto.context ? this.sanitizeText(dto.context) : undefined;

    const { version, prompt } = this.promptRegistry.buildThreatAnalysisPrompt(
      sanitizedInput,
      sanitizedContext,
    );

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        temperature: 0.2,
      });

      return this.outputValidator.validateThreatAnalysis(response.content, version, {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
      });
    } catch (err: any) {
      this.handleAiError('analyzeThreat', err);
    }
  }

  /**
   * Analyze user-submitted suspicious message for social engineering / phishing.
   */
  async analyzeMessage(_userId: string, dto: MessageAnalysisDto): Promise<MessageAnalyzerResult> {
    const sanitizedMessage = this.sanitizeText(dto.messageText);
    const sanitizedSender = dto.sender ? this.sanitizeText(dto.sender) : undefined;

    const { version, prompt } = this.promptRegistry.buildMessageAnalysisPrompt(
      sanitizedMessage,
      sanitizedSender,
    );

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        temperature: 0.2,
      });

      return this.outputValidator.validateMessageAnalysis(response.content, version, {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
      });
    } catch (err: any) {
      this.handleAiError('analyzeMessage', err);
    }
  }

  /**
   * Syntactic & structural AI URL analysis (Phase 7 orchestration boundary).
   */
  async analyzeUrl(_userId: string, dto: UrlAnalysisDto): Promise<UrlAnalysisResult> {
    let parsedUrl: URL;
    try {
      let candidate = dto.url.trim();
      if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
        candidate = 'https://' + candidate;
      }
      parsedUrl = new URL(candidate);
      if (
        !parsedUrl.hostname ||
        !parsedUrl.hostname.includes('.') ||
        parsedUrl.hostname.length < 4
      ) {
        throw new Error('Invalid domain');
      }
    } catch {
      throw new BadRequestException('Invalid URL format provided');
    }

    const normalizedUrl = parsedUrl.toString();
    const domain = parsedUrl.hostname;
    const protocol = parsedUrl.protocol;

    let externalThreatIntel: any = undefined;
    if (this.threatIntelService) {
      try {
        const intelResult = await this.threatIntelService.queryUrl(normalizedUrl);
        if (intelResult && intelResult.verdict !== 'UNAVAILABLE') {
          externalThreatIntel = {
            sourceDisplayName: intelResult.sourceDisplayName,
            verdict: intelResult.verdict,
            threatType: intelResult.threatType,
            severity: intelResult.severity,
            summary: intelResult.summary,
          };
        }
      } catch (err: any) {
        this.logger.warn(`Threat intelligence check failed during analyzeUrl: ${err.message}`);
      }
    }

    const { version, prompt } = this.promptRegistry.buildUrlAnalysisPrompt(
      normalizedUrl,
      domain,
      externalThreatIntel,
    );

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        temperature: 0.2,
      });

      const validated = this.outputValidator.validateUrlAnalysis(
        response.content,
        normalizedUrl,
        domain,
        protocol,
        version,
        {
          provider: response.provider,
          model: response.model,
          tokensUsed: response.tokensUsed,
        },
      );

      // If verified external threat intel identified a malicious site, ensure attribution reflects external source
      if (externalThreatIntel?.verdict === 'MALICIOUS') {
        validated.sourceAttribution = `${externalThreatIntel.sourceDisplayName} + Sentinel AI Orchestrator`;
        if (validated.riskLevel !== 'HIGH') {
          validated.riskLevel = 'HIGH';
        }
      }

      return validated;
    } catch (err: any) {
      this.handleAiError('analyzeUrl', err);
    }
  }

  /**
   * Visual AI analysis of user-submitted screenshot.
   * Temporary in-memory processing only — image is NEVER saved to database.
   */
  async analyzeScreenshot(
    _userId: string,
    dto: ScreenshotAnalysisDto,
  ): Promise<ScreenshotAnalyzerResult> {
    if (!dto.imageBase64 || dto.imageBase64.length < 50) {
      throw new BadRequestException('Invalid or empty image base64 data');
    }

    // Strip data URI prefix if provided (e.g. data:image/png;base64,...)
    const cleanBase64 = dto.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const sanitizedNote = dto.contextNote ? this.sanitizeText(dto.contextNote) : undefined;
    const { version, prompt } = this.promptRegistry.buildScreenshotAnalysisPrompt(sanitizedNote);

    try {
      const response = await this.aiProvider.generateStructured<any>({
        systemInstruction: this.promptRegistry.BASE_SYSTEM_INSTRUCTION,
        prompt,
        image: {
          base64: cleanBase64,
          mimeType: dto.mimeType,
        },
        temperature: 0.2,
      });

      return this.outputValidator.validateScreenshotAnalysis(response.content, version, {
        provider: response.provider,
        model: response.model,
        tokensUsed: response.tokensUsed,
      });
    } catch (err: any) {
      this.handleAiError('analyzeScreenshot', err);
    }
  }

  // ──────────────────────────────────────────
  // Privacy & Sanitization Boundary
  // ──────────────────────────────────────────

  private sanitizeEvidence(evidence: unknown): Array<{ key: string; value: unknown }> {
    if (!Array.isArray(evidence)) {
      return [];
    }

    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /machineguid/i,
      /guid/i,
      /private_key/i,
      /cookie/i,
      /auth/i,
    ];

    return evidence
      .map((item: any) => {
        const key = item?.label || item?.key || item?.name || 'signal';
        // Exclude sensitive fields completely from AI payloads
        if (sensitivePatterns.some((pattern) => pattern.test(key))) {
          return null;
        }

        let value = item?.value ?? item?.detail ?? item;
        if (typeof value === 'string') {
          value = this.sanitizeText(value);
        }

        return { key, value };
      })
      .filter((item): item is { key: string; value: unknown } => item !== null);
  }

  private sanitizeText(input: string): string {
    // Redact email addresses and common token formats if embedded accidentally
    return input
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, '[REDACTED_TOKEN]')
      .replace(/ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+/g, '[REDACTED_JWT]')
      .slice(0, 5000); // Enforce hard bound
  }

  // ──────────────────────────────────────────
  // Centralized Error Handling & Degradation
  // ──────────────────────────────────────────

  private handleAiError(operation: string, err: any): never {
    let errorCode: AiErrorCode = 'PROVIDER_UNAVAILABLE';
    let httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
    let message = 'AI intelligence service is temporarily unavailable';

    if (err instanceof GeminiProviderError) {
      errorCode = err.code;
      message = err.message;
      if (err.code === 'CONFIG_MISSING' || err.code === 'AUTH_FAILURE') {
        httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'AI intelligence provider is not configured or authenticated on this server';
      } else if (err.code === 'RATE_LIMIT') {
        httpStatus = HttpStatus.TOO_MANY_REQUESTS;
        message = 'AI intelligence rate limit exceeded. Please retry in a few moments.';
      } else if (err.code === 'TIMEOUT') {
        httpStatus = HttpStatus.GATEWAY_TIMEOUT;
        message = 'AI intelligence request timed out.';
      } else if (err.code === 'CONTENT_REJECTED') {
        httpStatus = HttpStatus.BAD_REQUEST;
        message = 'Content was rejected by the AI provider safety filters.';
      }
    } else if (err instanceof OutputValidationError) {
      errorCode = err.code;
      message = `AI output validation failed: ${err.message}`;
      httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;
    }

    this.logger.error(`AI operation [${operation}] failed with [${errorCode}]: ${message}`);

    throw new HttpException(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          retryable: errorCode === 'RATE_LIMIT' || errorCode === 'TIMEOUT',
        },
        timestamp: new Date().toISOString(),
      },
      httpStatus,
    );
  }
}
