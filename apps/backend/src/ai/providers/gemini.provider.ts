import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProvider,
  AiProviderRequest,
  AiProviderResponse,
} from '../interfaces/ai-provider.interface';
import { AiErrorCode } from '@sentinel/types';

export class GeminiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: AiErrorCode,
    public readonly status?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'GeminiProviderError';
  }
}

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string | null;
  private readonly model: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('SENTINEL_GEMINI_API_KEY') ||
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.SENTINEL_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      null;

    this.model =
      this.configService.get<string>('SENTINEL_GEMINI_MODEL') ||
      this.configService.get<string>('GEMINI_MODEL') ||
      process.env.SENTINEL_GEMINI_MODEL ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash';

    if (!this.apiKey) {
      this.logger.warn(
        'Gemini API key is not configured. Real AI requests will yield CONFIG_MISSING.',
      );
    } else {
      this.logger.log(`GeminiProvider initialized with model: ${this.model}`);
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  getProviderName(): string {
    return 'gemini';
  }

  getModelName(): string {
    return this.model;
  }

  async generateStructured<T>(request: AiProviderRequest): Promise<AiProviderResponse<T>> {
    if (!this.isConfigured()) {
      throw new GeminiProviderError(
        'Gemini API key is not configured in environment',
        'CONFIG_MISSING',
        401,
        false,
      );
    }

    const timeoutMs = request.timeoutMs ?? 20000;
    const maxRetries = 2;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      try {
        return await this.executeGenerateContent<T>(request, timeoutMs);
      } catch (err: any) {
        lastError = err;
        attempt++;

        // Only retry on rate-limit (429) or transient provider unavailable (503)
        if (err instanceof GeminiProviderError && err.retryable && attempt <= maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 200, 4000);
          this.logger.warn(
            `Gemini request attempt ${attempt} failed with ${err.code}. Retrying in ${delayMs.toFixed(0)}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw err;
      }
    }

    throw lastError || new GeminiProviderError('Max retries exceeded', 'PROVIDER_UNAVAILABLE', 503, false);
  }

  private async executeGenerateContent<T>(
    request: AiProviderRequest,
    timeoutMs: number,
  ): Promise<AiProviderResponse<T>> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];

    if (request.image) {
      parts.unshift({
        inlineData: {
          mimeType: request.image.mimeType,
          data: request.image.base64,
        },
      });
    }

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: request.temperature ?? 0.2,
      },
    };

    if (request.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: request.systemInstruction }],
      };
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey as string,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);

      if (!response.ok) {
        const status = response.status;
        let errorMessage = `Gemini API returned status ${status}`;
        let errorCode: AiErrorCode = 'PROVIDER_UNAVAILABLE';
        let retryable = false;

        try {
          const errBody = (await response.json()) as any;
          if (errBody?.error?.message) {
            errorMessage = errBody.error.message;
          }
        } catch {
          // Ignore JSON parse errors on error responses
        }

        if (status === 401 || status === 403) {
          errorCode = 'AUTH_FAILURE';
        } else if (status === 429) {
          errorCode = 'RATE_LIMIT';
          retryable = true;
        } else if (status === 400) {
          errorCode = 'INPUT_INVALID';
        } else if (status === 503 || status === 500 || status === 502 || status === 504) {
          errorCode = 'PROVIDER_UNAVAILABLE';
          retryable = true;
        }

        throw new GeminiProviderError(errorMessage, errorCode, status, retryable);
      }

      const data = (await response.json()) as any;

      // Check candidate safety blocks or empty candidates
      const candidate = data?.candidates?.[0];
      if (!candidate) {
        const promptFeedback = data?.promptFeedback;
        if (promptFeedback?.blockReason) {
          throw new GeminiProviderError(
            `Prompt blocked by provider safety policy: ${promptFeedback.blockReason}`,
            'CONTENT_REJECTED',
            400,
            false,
          );
        }
        throw new GeminiProviderError(
          'Gemini returned empty candidate list',
          'INVALID_PROVIDER_RESPONSE',
          500,
          false,
        );
      }

      if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
        throw new GeminiProviderError(
          `Response blocked due to finishReason: ${candidate.finishReason}`,
          'CONTENT_REJECTED',
          400,
          false,
        );
      }

      const partText = candidate.content?.parts?.[0]?.text;
      if (!partText) {
        throw new GeminiProviderError(
          'Gemini response part contained no text',
          'INVALID_PROVIDER_RESPONSE',
          500,
          false,
        );
      }

      let parsed: T;
      try {
        parsed = JSON.parse(partText) as T;
      } catch {
        throw new GeminiProviderError(
          'Gemini response could not be parsed as valid JSON',
          'INVALID_PROVIDER_RESPONSE',
          500,
          false,
        );
      }

      return {
        content: parsed,
        rawText: partText,
        provider: this.getProviderName(),
        model: this.getModelName(),
        tokensUsed: {
          promptTokens: data?.usageMetadata?.promptTokenCount,
          completionTokens: data?.usageMetadata?.candidatesTokenCount,
          totalTokens: data?.usageMetadata?.totalTokenCount,
        },
      };
    } catch (err: any) {
      clearTimeout(timeoutHandle);

      if (err instanceof GeminiProviderError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new GeminiProviderError(
          `Gemini request timed out after ${timeoutMs}ms`,
          'TIMEOUT',
          504,
          true,
        );
      }

      throw new GeminiProviderError(
        `Gemini network communication failed: ${err.message || 'Unknown network error'}`,
        'PROVIDER_UNAVAILABLE',
        503,
        true,
      );
    }
  }
}
