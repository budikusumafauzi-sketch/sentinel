import { Platform } from 'react-native';
import type {
  ApiResponse,
  AuthResponse,
  CreateDeviceInput,
  CreateScanInput,
  SyncEvidenceInput,
  SecurityExplanationResult,
  SecurityAdvisorResult,
  ThreatAnalyzerResult as AiThreatAnalyzerResult,
  ScreenshotAnalyzerResult,
  MessageAnalyzerResult,
  UrlAnalysisResult,
} from '@sentinel/types';


// Android emulator uses 10.0.2.2 to reach host; iOS simulator uses localhost
const getBaseUrl = (): string => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api/v1';
    }
    return 'http://localhost:3000/api/v1';
  }
  // Production URL would go here
  return 'http://localhost:3000/api/v1';
};

const BASE_URL = getBaseUrl();

class ApiClient {
  private accessToken: string | null = null;

  setToken(token: string | null) {
    this.accessToken = token;
  }

  getToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data?.error?.message || 'Request failed',
          response.status,
          data?.error?.code,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        'Network error — is the backend running?',
        0,
        'NETWORK_ERROR',
      );
    }
  }

  // ── Auth ────────────────────────────────
  async register(email: string, password: string, name?: string) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ id: string; email: string; name: string | null }>('/auth/me');
  }

  // ── Devices ─────────────────────────────
  async registerDevice(input: CreateDeviceInput) {
    return this.request<any>('/devices', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getDevices() {
    return this.request<any[]>('/devices');
  }

  // ── Scans ───────────────────────────────
  async createScan(input: CreateScanInput) {
    return this.request<any>('/scans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async syncScanEvidence(scanId: string, input: SyncEvidenceInput) {
    return this.request<any>(`/scans/${scanId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getScans() {
    return this.request<any[]>('/scans');
  }

  async getScan(id: string) {
    return this.request<any>(`/scans/${id}`);
  }

  async getScanReport(scanId: string) {
    return this.request<any>(`/scans/${scanId}/report`);
  }

  // ── Scores ──────────────────────────────
  async getLatestScore(deviceId: string) {
    return this.request<any>(`/scores/latest?deviceId=${deviceId}`);
  }

  // ── Findings ────────────────────────────
  async getDeviceFindings(deviceId: string) {
    return this.request<any[]>(`/findings/device/${deviceId}`);
  }

  // ── Recommendations ─────────────────────
  async getDeviceRecommendations(deviceId: string) {
    return this.request<any[]>(`/recommendations/device/${deviceId}`);
  }

  // ── History & Events ────────────────────
  async getDeviceHistory(deviceId: string) {
    return this.request<any[]>(`/devices/${deviceId}/history`);
  }

  async getDeviceEvents(deviceId: string) {
    return this.request<any[]>(`/devices/${deviceId}/events`);
  }

  // ── Phase 7: AI Intelligence ────────────
  async explainFinding(findingId: string) {
    return this.request<SecurityExplanationResult>(`/ai/findings/${findingId}/explain`, {
      method: 'POST',
    });
  }

  async getSecurityAdvisor(deviceId: string) {
    return this.request<SecurityAdvisorResult>('/ai/advisor', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  }

  async analyzeThreat(threatInput: string, context?: string) {
    return this.request<AiThreatAnalyzerResult>('/ai/threat', {
      method: 'POST',
      body: JSON.stringify({ threatInput, context }),
    });
  }

  async analyzeMessage(messageText: string, sender?: string) {
    return this.request<MessageAnalyzerResult>('/ai/message', {
      method: 'POST',
      body: JSON.stringify({ messageText, sender }),
    });
  }

  async analyzeUrl(url: string) {
    return this.request<UrlAnalysisResult>('/ai/url', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async analyzeScreenshot(imageBase64: string, mimeType: string, contextNote?: string) {
    return this.request<ScreenshotAnalyzerResult>('/ai/screenshot', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType, contextNote }),
    });
  }

  // ── Health ──────────────────────────────
  async healthCheck() {
    return this.request<any>('/health');
  }

}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
