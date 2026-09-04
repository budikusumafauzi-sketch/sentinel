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
      'gemini-3.6-flash';

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

    const timeoutMs = request.timeoutMs ?? 60000;
    const maxRetries = 4;
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
          let delayMs = Math.min(2500 * Math.pow(2, attempt) + Math.random() * 500, 10000);
          const match = err.message.match(/retry in (\d+(?:\.\d+)?)s/i);
          if (match && match[1]) {
            const parsedSeconds = parseFloat(match[1]);
            if (!isNaN(parsedSeconds) && parsedSeconds > 0 && parsedSeconds <= 45) {
              delayMs = Math.ceil(parsedSeconds * 1000) + 1000;
            }
          }
          this.logger.warn(
            `Gemini request attempt ${attempt} failed with ${err.code}. Retrying in ${delayMs.toFixed(0)}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw err;
      }
    }

    throw (
      lastError ||
      new GeminiProviderError('Max retries exceeded', 'PROVIDER_UNAVAILABLE', 503, false)
    );
  }

  private async executeGenerateContent<T>(
    request: AiProviderRequest,
    timeoutMs: number,
  ): Promise<AiProviderResponse<T>> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    let input: unknown = request.prompt;
    if (request.image) {
      input = [
        { type: 'text', text: request.prompt },
        {
          type: 'image',
          data: request.image.base64,
          mime_type: request.image.mimeType,
        },
      ];
    }

    const payload: Record<string, unknown> = {
      model: this.model,
      input,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
      },
      store: false, // Strict privacy: do not persist interaction server-side
    };

    if (request.systemInstruction) {
      payload.system_instruction = request.systemInstruction;
    }

    const url = `${this.baseUrl}/interactions`;

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

      if (data.status === 'failed') {
        throw new GeminiProviderError(
          data.error?.message || 'Gemini interaction status: failed',
          'PROVIDER_UNAVAILABLE',
          500,
          false,
        );
      }

      let partText: string | null = null;
      if (Array.isArray(data.steps)) {
        for (const step of data.steps) {
          if (step.type === 'model_output' && Array.isArray(step.content)) {
            for (const item of step.content) {
              if (item.type === 'text' && typeof item.text === 'string') {
                partText = (partText ? partText + '\n' : '') + item.text;
              }
            }
          }
        }
      }

      if (!partText) {
        throw new GeminiProviderError(
          'Gemini response contained no text in model output steps',
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
          promptTokens: data?.usage?.total_input_tokens ?? data?.usage?.raw_prompt_token,
          completionTokens: data?.usage?.total_output_tokens,
          totalTokens: data?.usage?.total_tokens,
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
