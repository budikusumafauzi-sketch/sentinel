import { requireOptionalNativeModule } from 'expo-modules-core';

export interface NativeDeviceInfo {
  manufacturer: string;
  model: string;
  brand?: string;
  product?: string;
  device?: string;
  hardware?: string;
  id?: string;
  tags?: string;
  fingerprint?: string;
  osVersion: string;
  apiLevel?: number;
  securityPatch?: string | null;
  supportedAbis?: string[];
  isEmulator?: boolean;
}

export interface NativeSystemSignals {
  isDeviceSecure?: boolean | null;
  isKeyguardSecure?: boolean | null;
  isDeviceLocked?: boolean | null;
  biometricStatus: string;
  encryptionStatus: string;
  developerOptionsEnabled?: boolean | null;
  adbEnabled?: boolean | null;
  installNonMarketAppsAllowed?: boolean | null;
  buildTags?: string | null;
}

export interface NativeNetworkSignals {
  isConnected: boolean;
  hasInternet: boolean;
  isValidated: boolean;
  isVpn: boolean;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
}

export interface NativeAppDiscoveryResult {
  status: 'discovered' | 'partially_discoverable' | 'unavailable';
  totalDiscovered: number;
  limitationReason?: string | null;
  applications: Array<{
    name: string;
    packageName: string;
    versionName?: string | null;
    versionCode?: number | null;
    isSystemApp: boolean;
    installSource?: string | null;
    requestedPermissions?: string[];
    grantedPermissions?: string[];
  }>;
}

export interface SentinelDeviceIntelligenceNative {
  getDeviceInfo(): Promise<NativeDeviceInfo>;
  getSystemSignals(): Promise<NativeSystemSignals>;
  getNetworkSignals(): Promise<NativeNetworkSignals>;
  getInstalledApplications(): Promise<NativeAppDiscoveryResult>;
  getCapabilities(): Promise<Record<string, string>>;
}

const NativeModule = requireOptionalNativeModule<SentinelDeviceIntelligenceNative>(
  'SentinelDeviceIntelligence',
);

export const SentinelDeviceIntelligence = {
  isAvailable(): boolean {
    return NativeModule !== null;
  },

  async getDeviceInfo(): Promise<NativeDeviceInfo> {
    if (!NativeModule) {
      throw new Error('SentinelDeviceIntelligence native module is not available');
    }
    return NativeModule.getDeviceInfo();
  },

  async getSystemSignals(): Promise<NativeSystemSignals> {
    if (!NativeModule) {
      throw new Error('SentinelDeviceIntelligence native module is not available');
    }
    return NativeModule.getSystemSignals();
  },

  async getNetworkSignals(): Promise<NativeNetworkSignals> {
    if (!NativeModule) {
      throw new Error('SentinelDeviceIntelligence native module is not available');
    }
    return NativeModule.getNetworkSignals();
  },

  async getInstalledApplications(): Promise<NativeAppDiscoveryResult> {
    if (!NativeModule) {
      throw new Error('SentinelDeviceIntelligence native module is not available');
    }
    return NativeModule.getInstalledApplications();
  },

  async getCapabilities(): Promise<Record<string, string>> {
    if (!NativeModule) {
      throw new Error('SentinelDeviceIntelligence native module is not available');
    }
    return NativeModule.getCapabilities();
  },
};
