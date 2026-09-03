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
    details?: unknown;
  };
  path?: string;
  timestamp: string;
}

/** Health check status. */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
}

/** Device platform enumeration. */
export type DevicePlatform = 'ANDROID' | 'IOS' | 'WINDOWS' | 'MACOS' | 'LINUX';

/** Scan status enumeration. */
export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/** Scan type enumeration. */
export type ScanType = 'QUICK' | 'FULL' | 'CUSTOM';

/** Finding severity enumeration. */
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/** Finding status enumeration. */
export type FindingStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED' | 'FALSE_POSITIVE';

/** Finding category enumeration. */
export type FindingCategory =
  | 'SYSTEM'
  | 'APPLICATION'
  | 'NETWORK'
  | 'PRIVACY'
  | 'AUTHENTICATION'
  | 'ENCRYPTION'
  | 'PERMISSIONS'
  | 'UPDATE'
  | 'CONFIGURATION'
  | 'OTHER';

/** Recommendation priority enumeration. */
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Recommendation status enumeration. */
export type RecommendationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED' | 'EXPIRED';

/** Auth response. */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  accessToken: string;
}

/** Device registration input. */
export interface CreateDeviceInput {
  name: string;
  platform: DevicePlatform;
  osVersion?: string;
  model?: string;
  manufacturer?: string;
}

/** Scan creation input. */
export interface CreateScanInput {
  deviceId: string;
  type?: ScanType;
}
