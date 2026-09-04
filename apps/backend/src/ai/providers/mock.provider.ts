import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../interfaces/ai-provider.interface';
import { GeminiProviderError } from './gemini.provider';

@Injectable()
export class MockAiProvider implements AiProvider {
  private customHandler: ((request: AiProviderRequest) => Promise<any>) | null = null;
  private configured: boolean = true;
  private model: string = 'mock-gemini-2.5-flash';

  setMockHandler(handler: ((request: AiProviderRequest) => Promise<any>) | null) {
    this.customHandler = handler;
  }

  setConfigured(configured: boolean) {
    this.configured = configured;
  }

  setModel(model: string) {
    this.model = model;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  getProviderName(): string {
    return 'mock-gemini';
  }

  getModelName(): string {
    return this.model;
  }

  async generateStructured<T>(request: AiProviderRequest): Promise<AiProviderResponse<T>> {
    if (!this.isConfigured()) {
      throw new GeminiProviderError(
        'AI Provider is not configured',
        'CONFIG_MISSING',
        401,
        false,
      );
    }

    if (this.customHandler) {
      const customContent = await this.customHandler(request);
      return {
        content: customContent,
        rawText: JSON.stringify(customContent),
        provider: this.getProviderName(),
        model: this.getModelName(),
        tokensUsed: { promptTokens: 120, completionTokens: 80, totalTokens: 200 },
      };
    }

    // Default deterministic responses based on prompt keywords
    const prompt = request.prompt;
    let defaultContent: any;

    if (prompt.includes('SECURITY_EXPLANATION_V1')) {
      defaultContent = {
        summary: 'Mock finding explanation summary based on verified evidence.',
        explanation: 'The system has detected an unencrypted volume or inactive firewall rule.',
        whyItMatters: 'Unencrypted storage exposes personal user data to unauthorized physical access.',
        evidenceReferences: ['BitLocker status', 'Encryption cipher AES-256'],
        impact: 'Potential data confidentiality loss in case of physical device theft.',
        remediation: 'Enable device encryption in Windows Settings or BitLocker Control Panel.',
        limitations: ['Verified via local WMI; TPM hardware presence not evaluated.'],
        confidence: 0.95,
      };
    } else if (prompt.includes('SECURITY_ADVISOR_V1')) {
      defaultContent = {
        recommendations: [
          {
            recommendation: 'Enable BitLocker Drive Encryption',
            rationale: 'Addresses high-risk unencrypted system drive finding.',
            priority: 'HIGH',
            affectedFindingId: 'f-1',
            affectedControl: 'Disk Encryption',
            evidenceReferences: ['os_disk_encryption'],
            steps: ['Open Settings', 'Navigate to Privacy & Security', 'Turn on Device Encryption'],
            limitations: ['Requires administrative privileges'],
            confidence: 0.92,
          },
        ],
        overallGuidance: 'Prioritize disk encryption and update antivirus definitions.',
        priorityRationale: 'Encryption directly protects stored personal credentials and identity files.',
        limitations: ['Based only on currently synchronized findings.'],
        confidence: 0.9,
      };
    } else if (prompt.includes('THREAT_ANALYZER_V1')) {
      defaultContent = {
        classification: 'SUSPICIOUS',
        riskInterpretation: 'The input indicates potential social engineering or phishing tactics.',
        indicators: ['Urgent account suspension claim', 'Unverified external domain'],
        explanation: 'The message employs psychological pressure to compel immediate action.',
        confidence: 0.88,
        evidence: ['Keyword: Akun Anda akan diblokir', 'Unverified link domain'],
        limitations: ['AI pattern interpretation only; domain registry not verified.'],
      };
    } else if (prompt.includes('SCREENSHOT_ANALYZER_V1')) {
      defaultContent = {
        detectedElements: ['Login dialog window', 'Fake Microsoft header', 'Password prompt field'],
        suspiciousIndicators: ['Mismatched domain URL in title bar', 'Urgent warning banner'],
        explanation: 'The screenshot displays characteristics of a credential-harvesting prompt.',
        confidence: 0.89,
        limitations: ['Visual AI inspection only; certificate details not verifiable from pixel data.'],
        isContentSufficient: true,
        recommendedAction: 'Do not enter credentials. Close the window immediately.',
      };
    } else if (prompt.includes('MESSAGE_ANALYZER_V1')) {
      defaultContent = {
        classification: 'PHISHING',
        suspiciousIndicators: ['Artificial urgency', 'Threat of account termination', 'Suspicious link'],
        explanation: 'Typical phishing message seeking credential or OTP submission under false pretenses.',
        urgencyTacticsDetected: true,
        credentialHarvestingRisk: true,
        recommendedAction: 'Delete the message and block the sender. Do not click links.',
        confidence: 0.94,
        limitations: ['Text analysis only; sender identity could not be verified via carrier headers.'],
      };
    } else if (prompt.includes('URL_ANALYZER_V1')) {
      defaultContent = {
        normalizedUrl: 'https://example-suspicious-login.com/auth',
        domain: 'example-suspicious-login.com',
        protocol: 'https:',
        observations: ['Typosquatting or generic credential collection path pattern.'],
        riskInterpretation: 'Suspicious domain structure mimicking authentication portals.',
        riskLevel: 'HIGH',
        confidence: 0.87,
        limitations: ['Phase 7 syntactic/heuristic interpretation; Phase 8 threat feeds not queried.'],
        sourceAttribution: 'Sentinel AI Pattern Analyzer',
      };
    } else {
      defaultContent = {
        message: 'Mock default structured response',
        confidence: 0.8,
      };
    }

    return {
      content: defaultContent as T,
      rawText: JSON.stringify(defaultContent),
      provider: this.getProviderName(),
      model: this.getModelName(),
      tokensUsed: { promptTokens: 100, completionTokens: 75, totalTokens: 175 },
    };
  }
}
