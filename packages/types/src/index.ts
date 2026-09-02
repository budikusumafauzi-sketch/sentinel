/**
 * Sentinel shared types — foundation contracts.
 *
 * These types are consumed by both the backend and mobile applications
 * to ensure consistent API contracts across the monorepo.
 */

/** Standard API response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/** API error response. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/** Health check status. */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
}
