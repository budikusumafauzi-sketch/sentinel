import { Platform } from 'react-native';
import type { ApiResponse, AuthResponse, CreateDeviceInput, CreateScanInput } from '@sentinel/types';

// Android emulator uses 10.0.2.2 to reach host; iOS simulator uses localhost
const getBaseUrl = (): string => {
  if (__DEV__) {
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

  async getScans() {
    return this.request<any[]>('/scans');
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
