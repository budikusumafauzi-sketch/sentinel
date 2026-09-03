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
export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

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

// ──────────────────────────────────────────
// Phase 4: Device Intelligence & Evidence
// ──────────────────────────────────────────

/**
 * Sentinel Data Trust Model (PRD Section 18).
 * Explicit information provenance for all security signals.
 */
export type DataTrustState =
  | 'VERIFIED'           // Directly obtained from an authorized system/API
  | 'USER_PROVIDED'      // Explicitly supplied by the user
  | 'ANALYZED'           // Derived from evidence through security analysis
  | 'NOT_AVAILABLE'      // The platform does not expose the required information
  | 'PERMISSION_REQUIRED' // The check is possible but requires user authorization
  | 'UNABLE_TO_VERIFY';  // The system attempted the check but could not establish a reliable result

/**
 * Platform check capability availability.
 */
export type CapabilityStatus =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_AVAILABLE'
  | 'PERMISSION_REQUIRED'
  | 'UNABLE_TO_VERIFY';

/**
 * Single piece of structured security evidence with provenance.
 */
export interface EvidenceItem {
  checkId: string;
  category: FindingCategory;
  checkName: string;
  value: unknown;
  trustState: DataTrustState;
  source: string;
  platform: DevicePlatform;
  timestamp: string;
  capabilityStatus: CapabilityStatus;
  permission?: string;
  permissionGranted?: boolean;
  notes?: string;
}

/**
 * Discovered application metadata (read-only, no APK collection).
 */
export interface DiscoveredAppEvidence {
  name: string;
  packageName: string;
  versionName?: string | null;
  versionCode?: number | null;
  isSystemApp: boolean;
  installSource?: string | null;
  requestedPermissions?: string[];
  grantedPermissions?: string[];
}

/**
 * Normalized device inspection output.
 */
export interface DeviceInspectionResult {
  deviceId?: string;
  deviceInfo: {
    manufacturer: string;
    model: string;
    brand?: string;
    product?: string;
    device?: string;
    osVersion: string;
    apiLevel?: number;
    securityPatch?: string | null;
    fingerprint?: string;
    supportedAbis?: string[];
    hardware?: string;
    isEmulator?: boolean;
  };
  systemSignals: Record<string, EvidenceItem>;
  applicationDiscovery: {
    status: 'discovered' | 'partially_discoverable' | 'unavailable';
    totalDiscovered: number;
    limitationReason?: string;
    applications: DiscoveredAppEvidence[];
  };
  networkSignals: Record<string, EvidenceItem>;
  capabilities: Record<string, CapabilityStatus>;
  inspectedAt: string;
  rawEvidence: EvidenceItem[];
}

/**
 * Payload for synchronizing evidence with the backend.
 */
export interface SyncEvidenceInput {
  rawEvidence: EvidenceItem[];
  capabilities: Record<string, CapabilityStatus>;
  deviceInfo?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
  };
  summary?: string;
}

/**
 * Desktop agent boundary contract (Phase 4 desktop foundation).
 * Prepares registration and evidence synchronization for future Tauri/Rust agent.
 */
export interface DesktopAgentContract {
  agentVersion: string;
  platform: 'WINDOWS' | 'MACOS' | 'LINUX';
  registerDevice(name: string): Promise<CreateDeviceInput>;
  collectEvidence(): Promise<EvidenceItem[]>;
}

// ──────────────────────────────────────────
// Phase 5: Security Engine & Intelligence
// ──────────────────────────────────────────
export * from './security-engine';

