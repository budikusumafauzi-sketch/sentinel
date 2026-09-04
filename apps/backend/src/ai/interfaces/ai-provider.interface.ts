/**
 * Sentinel Phase 7: AI Provider Abstraction Interface.
 *
 * Keeps the provider replaceable and decouples business logic from Gemini-specific structures.
 */

export interface AiProviderRequest {
  systemInstruction?: string;
  prompt: string;
  responseSchema?: Record<string, unknown>;
  image?: {
    base64: string;
    mimeType: string;
  };
  temperature?: number;
  timeoutMs?: number;
}

export interface AiProviderResponse<T> {
  content: T;
  rawText: string;
  provider: string;
  model: string;
  tokensUsed?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AiProvider {
  /** Generate a strongly-typed structured JSON response */
  generateStructured<T>(request: AiProviderRequest): Promise<AiProviderResponse<T>>;

  /** Check if the provider is properly configured with credentials */
  isConfigured(): boolean;

  /** Get provider identification string (e.g. "gemini") */
  getProviderName(): string;

  /** Get configured model identifier */
  getModelName(): string;
}

export const AI_PROVIDER_TOKEN = 'AI_PROVIDER_TOKEN';
