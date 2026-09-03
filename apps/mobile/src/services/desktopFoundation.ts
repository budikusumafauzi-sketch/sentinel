/**
 * Sentinel Desktop Foundation (Phase 4).
 *
 * Defines the contract and architecture boundary for the future
 * Phase 6 desktop agent (Tauri/Rust). Ensures platform-neutral device
 * intelligence interface compatibility and secure device registration.
 *
 * NOTE: As per Phase 4 boundary, no Windows system inspection or Rust agent
 * implementation is performed here.
 */

import type {
  DesktopAgentContract,
  CreateDeviceInput,
  EvidenceItem,
  DevicePlatform,
} from '@sentinel/types';

export class DesktopAgentFoundation implements DesktopAgentContract {
  readonly agentVersion = '0.1.0-foundation';
  readonly platform: 'WINDOWS' | 'MACOS' | 'LINUX';

  constructor(platform: 'WINDOWS' | 'MACOS' | 'LINUX' = 'WINDOWS') {
    this.platform = platform;
  }

  /**
   * Prepares registration payload compatible with the existing backend
   * device registration contract (POST /api/v1/devices).
   */
  async registerDevice(name: string): Promise<CreateDeviceInput> {
    return {
      name,
      platform: this.platform as DevicePlatform,
      model: `${this.platform} Workstation`,
      manufacturer: 'Sentinel Desktop Client',
    };
  }

  /**
   * Collects evidence placeholder — will be implemented by the native
   * Tauri/Rust core in Phase 6.
   */
  async collectEvidence(): Promise<EvidenceItem[]> {
    // Phase 4 boundary: desktop system inspection is intentionally deferred to Phase 6.
    return [];
  }
}

export const desktopFoundation = new DesktopAgentFoundation();
