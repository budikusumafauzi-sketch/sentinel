import { Platform } from 'react-native';
import type {
  CapabilityStatus,
  DeviceInspectionResult,
  DevicePlatform,
  DiscoveredAppEvidence,
  EvidenceItem,
  SyncEvidenceInput,
} from '@sentinel/types';
import { SentinelDeviceIntelligence } from '../../modules/sentinel-device-intelligence/src';
import { apiClient } from '../api/client';

export interface ScanStageProgress {
  stage: string;
  progress: number;
}

export class DeviceScannerService {
  /**
   * Orchestrates the complete Phase 4 device inspection.
   * Read-only by default: never modifies device state or settings.
   */
  async runScan(
    onProgress?: (progress: ScanStageProgress) => void,
    syncWithBackend = true,
  ): Promise<DeviceInspectionResult> {
    const timestamp = new Date().toISOString();
    const platform: DevicePlatform = Platform.OS === 'android' ? 'ANDROID' : Platform.OS === 'ios' ? 'IOS' : 'WINDOWS';

    // ── Stage 1: Device Discovery Baseline ──────────────────────
    onProgress?.({ stage: 'Discovering device baseline & hardware...', progress: 15 });
    const isNative = SentinelDeviceIntelligence.isAvailable();

    let rawDeviceInfo: any;
    try {
      rawDeviceInfo = isNative
        ? await SentinelDeviceIntelligence.getDeviceInfo()
        : this.getFallbackDeviceInfo(platform);
    } catch {
      rawDeviceInfo = this.getFallbackDeviceInfo(platform);
    }

    // ── Stage 2: System & Security Signals ──────────────────────
    onProgress?.({ stage: 'Inspecting operating system & security signals...', progress: 40 });
    let rawSystemSignals: any;
    try {
      rawSystemSignals = isNative
        ? await SentinelDeviceIntelligence.getSystemSignals()
        : this.getFallbackSystemSignals();
    } catch {
      rawSystemSignals = this.getFallbackSystemSignals();
    }

    // ── Stage 3: Application & Permission Discovery ─────────────
    onProgress?.({ stage: 'Discovering applications & permissions within platform limits...', progress: 65 });
    let rawAppDiscovery: any;
    try {
      rawAppDiscovery = isNative
        ? await SentinelDeviceIntelligence.getInstalledApplications()
        : { status: 'unavailable', totalDiscovered: 0, applications: [], limitationReason: 'Native module unavailable in current environment' };
    } catch {
      rawAppDiscovery = { status: 'unavailable', totalDiscovered: 0, applications: [], limitationReason: 'Failed to query application inventory' };
    }

    // ── Stage 4: Network & Connectivity Signals ─────────────────
    onProgress?.({ stage: 'Inspecting network & connectivity signals...', progress: 80 });
    let rawNetworkSignals: any;
    try {
      rawNetworkSignals = isNative
        ? await SentinelDeviceIntelligence.getNetworkSignals()
        : this.getFallbackNetworkSignals();
    } catch {
      rawNetworkSignals = this.getFallbackNetworkSignals();
    }

    // ── Stage 5: Capabilities & Evidence Normalization ──────────
    onProgress?.({ stage: 'Evaluating capabilities & recording evidence...', progress: 90 });
    let rawCapabilities: Record<string, string> = {};
    try {
      rawCapabilities = isNative
        ? await SentinelDeviceIntelligence.getCapabilities()
        : this.getFallbackCapabilities(platform);
    } catch {
      rawCapabilities = this.getFallbackCapabilities(platform);
    }

    const capabilities: Record<string, CapabilityStatus> = {};
    for (const [key, val] of Object.entries(rawCapabilities)) {
      capabilities[key] = val as CapabilityStatus;
    }

    // Build normalized evidence collection
    const rawEvidence: EvidenceItem[] = [];

    // Helper to push evidence with provenance
    const addEvidence = (item: EvidenceItem) => {
      rawEvidence.push(item);
    };

    // Device metadata evidence
    addEvidence({
      checkId: 'device.manufacturer',
      category: 'SYSTEM',
      checkName: 'Device Manufacturer',
      value: rawDeviceInfo.manufacturer,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: platform === 'ANDROID' ? 'android.os.Build.MANUFACTURER' : 'UIDevice.model',
      platform,
      timestamp,
      capabilityStatus: capabilities['device_metadata'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'device.model',
      category: 'SYSTEM',
      checkName: 'Device Model',
      value: rawDeviceInfo.model,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: platform === 'ANDROID' ? 'android.os.Build.MODEL' : 'UIDevice.model',
      platform,
      timestamp,
      capabilityStatus: capabilities['device_metadata'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'os.version',
      category: 'SYSTEM',
      checkName: 'Operating System Release',
      value: rawDeviceInfo.osVersion,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: platform === 'ANDROID' ? 'android.os.Build.VERSION.RELEASE' : 'UIDevice.systemVersion',
      platform,
      timestamp,
      capabilityStatus: capabilities['os_version'] ?? 'SUPPORTED',
    });

    if (rawDeviceInfo.securityPatch !== undefined) {
      addEvidence({
        checkId: 'os.security_patch',
        category: 'UPDATE',
        checkName: 'Android Security Patch Level',
        value: rawDeviceInfo.securityPatch,
        trustState: rawDeviceInfo.securityPatch ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY') : 'NOT_AVAILABLE',
        source: 'android.os.Build.VERSION.SECURITY_PATCH',
        platform,
        timestamp,
        capabilityStatus: capabilities['security_patch'] ?? 'SUPPORTED',
        notes: rawDeviceInfo.securityPatch ? undefined : 'Security patch level not exposed on this platform',
      });
    }

    // Security & system signals evidence
    addEvidence({
      checkId: 'security.screen_lock',
      category: 'AUTHENTICATION',
      checkName: 'Device Screen Lock Configured',
      value: rawSystemSignals.isDeviceSecure,
      trustState: rawSystemSignals.isDeviceSecure !== null ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY') : 'NOT_AVAILABLE',
      source: platform === 'ANDROID' ? 'android.app.KeyguardManager.isDeviceSecure()' : 'LocalAuthentication',
      platform,
      timestamp,
      capabilityStatus: capabilities['screen_lock'] ?? 'SUPPORTED',
      notes: rawSystemSignals.isDeviceSecure === null ? 'Screen lock configuration not exposed by platform public API' : undefined,
    });

    addEvidence({
      checkId: 'security.biometrics',
      category: 'AUTHENTICATION',
      checkName: 'Biometric Authentication Hardware & Enrollment',
      value: rawSystemSignals.biometricStatus,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: platform === 'ANDROID' ? 'androidx.biometric.BiometricManager' : 'LAContext',
      platform,
      timestamp,
      capabilityStatus: capabilities['biometrics'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'security.storage_encryption',
      category: 'ENCRYPTION',
      checkName: 'Device Storage Encryption Status',
      value: rawSystemSignals.encryptionStatus,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: platform === 'ANDROID' ? 'android.app.admin.DevicePolicyManager.getStorageEncryptionStatus()' : 'iOS Hardware Data Protection',
      platform,
      timestamp,
      capabilityStatus: capabilities['encryption_status'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'security.developer_options',
      category: 'CONFIGURATION',
      checkName: 'Developer Options Setting',
      value: rawSystemSignals.developerOptionsEnabled,
      trustState: rawSystemSignals.developerOptionsEnabled !== null ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY') : 'NOT_AVAILABLE',
      source: 'Settings.Global.DEVELOPMENT_SETTINGS_ENABLED',
      platform,
      timestamp,
      capabilityStatus: capabilities['developer_options'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'security.adb_debugging',
      category: 'CONFIGURATION',
      checkName: 'USB Debugging (ADB) Setting',
      value: rawSystemSignals.adbEnabled,
      trustState: rawSystemSignals.adbEnabled !== null ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY') : 'NOT_AVAILABLE',
      source: 'Settings.Global.ADB_ENABLED',
      platform,
      timestamp,
      capabilityStatus: capabilities['adb_enabled'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'security.unknown_sources',
      category: 'CONFIGURATION',
      checkName: 'Install Unknown Applications Setting',
      value: rawSystemSignals.installNonMarketAppsAllowed,
      trustState: rawSystemSignals.installNonMarketAppsAllowed !== null ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY') : 'NOT_AVAILABLE',
      source: 'PackageManager.canRequestPackageInstalls()',
      platform,
      timestamp,
      capabilityStatus: capabilities['unknown_sources'] ?? 'SUPPORTED',
    });

    // Network signals evidence
    addEvidence({
      checkId: 'network.connectivity',
      category: 'NETWORK',
      checkName: 'Active Network Connectivity',
      value: {
        isConnected: rawNetworkSignals.isConnected,
        hasInternet: rawNetworkSignals.hasInternet,
        isValidated: rawNetworkSignals.isValidated,
        isWifi: rawNetworkSignals.isWifi,
        isCellular: rawNetworkSignals.isCellular,
      },
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: 'android.net.ConnectivityManager',
      platform,
      timestamp,
      capabilityStatus: capabilities['network_connectivity'] ?? 'SUPPORTED',
    });

    addEvidence({
      checkId: 'network.vpn_transport',
      category: 'NETWORK',
      checkName: 'Active VPN Transport Detection',
      value: rawNetworkSignals.isVpn,
      trustState: isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY',
      source: 'NetworkCapabilities.TRANSPORT_VPN',
      platform,
      timestamp,
      capabilityStatus: capabilities['vpn_detection'] ?? 'SUPPORTED',
    });

    // Application & permission discovery evidence
    const appEvidenceList: DiscoveredAppEvidence[] = (rawAppDiscovery.applications || []).map((app: any) => ({
      name: app.name,
      packageName: app.packageName,
      versionName: app.versionName,
      versionCode: app.versionCode,
      isSystemApp: app.isSystemApp,
      installSource: app.installSource,
      requestedPermissions: app.requestedPermissions,
      grantedPermissions: app.grantedPermissions,
    }));

    addEvidence({
      checkId: 'apps.inventory',
      category: 'APPLICATION',
      checkName: 'Installed Application Discovery',
      value: {
        totalDiscovered: rawAppDiscovery.totalDiscovered,
        status: rawAppDiscovery.status,
        limitationReason: rawAppDiscovery.limitationReason,
      },
      trustState: rawAppDiscovery.status === 'discovered' || rawAppDiscovery.status === 'partially_discoverable'
        ? (isNative ? 'VERIFIED' : 'UNABLE_TO_VERIFY')
        : 'NOT_AVAILABLE',
      source: platform === 'ANDROID' ? 'android.content.pm.PackageManager.getInstalledPackages()' : 'iOS Sandbox',
      platform,
      timestamp,
      capabilityStatus: capabilities['application_discovery'] ?? 'PARTIALLY_SUPPORTED',
      notes: rawAppDiscovery.limitationReason ?? undefined,
    });

    // Unsupported / permission-required checks explicitly marked per PRD
    addEvidence({
      checkId: 'network.wifi_ssid',
      category: 'NETWORK',
      checkName: 'Wi-Fi SSID Inspection',
      value: null,
      trustState: 'PERMISSION_REQUIRED',
      source: 'WifiInfo.getSSID()',
      platform,
      timestamp,
      capabilityStatus: 'PERMISSION_REQUIRED',
      permission: 'android.permission.ACCESS_FINE_LOCATION',
      permissionGranted: false,
      notes: 'Wi-Fi SSID inspection requires explicit fine location permission on Android 10+. Sentinel does not request location permission by default.',
    });

    addEvidence({
      checkId: 'system.hardware_attestation',
      category: 'SYSTEM',
      checkName: 'Hardware Security Module & Attestation',
      value: null,
      trustState: 'UNABLE_TO_VERIFY',
      source: 'KeyStore KeyGenParameterSpec attestation',
      platform,
      timestamp,
      capabilityStatus: 'UNABLE_TO_VERIFY',
      notes: 'Hardware attestation requires cloud verification backend (Play Integrity API / SafetyNet). Standalone offline verification is unable to verify root of trust.',
    });

    // Build system signals map
    const systemSignalsMap: Record<string, EvidenceItem> = {};
    const networkSignalsMap: Record<string, EvidenceItem> = {};

    for (const item of rawEvidence) {
      if (item.category === 'SYSTEM' || item.category === 'AUTHENTICATION' || item.category === 'ENCRYPTION' || item.category === 'UPDATE' || item.category === 'CONFIGURATION') {
        systemSignalsMap[item.checkId] = item;
      } else if (item.category === 'NETWORK') {
        networkSignalsMap[item.checkId] = item;
      }
    }

    const inspectionResult: DeviceInspectionResult = {
      deviceInfo: {
        manufacturer: rawDeviceInfo.manufacturer || 'Unknown',
        model: rawDeviceInfo.model || 'Unknown',
        brand: rawDeviceInfo.brand,
        product: rawDeviceInfo.product,
        device: rawDeviceInfo.device,
        osVersion: rawDeviceInfo.osVersion || 'Unknown',
        apiLevel: rawDeviceInfo.apiLevel,
        securityPatch: rawDeviceInfo.securityPatch,
        fingerprint: rawDeviceInfo.fingerprint,
        supportedAbis: rawDeviceInfo.supportedAbis,
        hardware: rawDeviceInfo.hardware,
        isEmulator: rawDeviceInfo.isEmulator,
      },
      systemSignals: systemSignalsMap,
      applicationDiscovery: {
        status: rawAppDiscovery.status || 'partially_discoverable',
        totalDiscovered: appEvidenceList.length,
        limitationReason: rawAppDiscovery.limitationReason,
        applications: appEvidenceList,
      },
      networkSignals: networkSignalsMap,
      capabilities,
      inspectedAt: timestamp,
      rawEvidence,
    };

    // ── Stage 6: Backend Synchronization ────────────────────────
    if (syncWithBackend) {
      onProgress?.({ stage: 'Synchronizing evidence with Sentinel Intelligence backend...', progress: 95 });
      try {
        await this.syncEvidenceToBackend(inspectionResult, platform);
      } catch (err) {
        // Backend synchronization error does not discard local scan evidence
        console.warn('Evidence synchronization to backend failed (offline or unauthenticated):', err);
      }
    }

    onProgress?.({ stage: 'Device inspection completed.', progress: 100 });
    return inspectionResult;
  }

  /**
   * Synchronizes discovered device and evidence with the Sentinel backend.
   */
  private async syncEvidenceToBackend(result: DeviceInspectionResult, platform: DevicePlatform): Promise<void> {
    const token = apiClient.getToken();
    if (!token) {
      // Offline / guest scan without auth — skip backend sync
      return;
    }

    // 1. Identify or register the device with the backend
    let deviceId: string | null = null;
    try {
      const devicesRes = await apiClient.getDevices();
      const existing = devicesRes.data?.find(
        (d: any) => d.platform === platform && (d.model === result.deviceInfo.model || d.name.includes(result.deviceInfo.model)),
      );
      if (existing) {
        deviceId = existing.id;
      }
    } catch {
      // Ignored
    }

    if (!deviceId) {
      const regRes = await apiClient.registerDevice({
        name: `${result.deviceInfo.manufacturer} ${result.deviceInfo.model}`.trim() || 'Sentinel Android Client',
        platform,
        model: result.deviceInfo.model,
        manufacturer: result.deviceInfo.manufacturer,
        osVersion: result.deviceInfo.osVersion,
      });
      deviceId = regRes.data?.id;
    }

    if (!deviceId) return;
    result.deviceId = deviceId;

    // 2. Create scan record
    const scanRes = await apiClient.createScan({
      deviceId,
      type: 'FULL',
    });
    const scanId = scanRes.data?.id;
    if (!scanId) return;

    // 3. Synchronize evidence
    const syncInput: SyncEvidenceInput = {
      rawEvidence: result.rawEvidence,
      capabilities: result.capabilities,
      deviceInfo: {
        manufacturer: result.deviceInfo.manufacturer,
        model: result.deviceInfo.model,
        osVersion: result.deviceInfo.osVersion,
      },
      summary: `Discovered ${result.rawEvidence.length} evidence items (${result.applicationDiscovery.totalDiscovered} apps visible)`,
    };

    await apiClient.syncScanEvidence(scanId, syncInput);
  }

  // ── Fallbacks for non-native test/web environments ──────────
  private getFallbackDeviceInfo(platform: DevicePlatform) {
    return {
      manufacturer: platform === 'ANDROID' ? 'Google' : 'Apple',
      model: platform === 'ANDROID' ? 'Pixel 8a' : 'iPhone',
      osVersion: platform === 'ANDROID' ? '15' : '18.0',
      apiLevel: 35,
      securityPatch: '2026-08-05',
      isEmulator: true,
      supportedAbis: ['x86_64'],
    };
  }

  private getFallbackSystemSignals() {
    return {
      isDeviceSecure: true,
      isKeyguardSecure: true,
      isDeviceLocked: false,
      biometricStatus: 'AVAILABLE',
      encryptionStatus: 'ACTIVE',
      developerOptionsEnabled: false,
      adbEnabled: false,
      installNonMarketAppsAllowed: false,
      buildTags: 'release-keys',
    };
  }

  private getFallbackNetworkSignals() {
    return {
      isConnected: true,
      hasInternet: true,
      isValidated: true,
      isVpn: false,
      isWifi: true,
      isCellular: false,
      isEthernet: false,
    };
  }

  private getFallbackCapabilities(platform: DevicePlatform) {
    return {
      device_metadata: 'SUPPORTED',
      os_version: 'SUPPORTED',
      security_patch: platform === 'ANDROID' ? 'SUPPORTED' : 'NOT_AVAILABLE',
      screen_lock: 'SUPPORTED',
      biometrics: 'SUPPORTED',
      encryption_status: 'SUPPORTED',
      developer_options: platform === 'ANDROID' ? 'SUPPORTED' : 'NOT_AVAILABLE',
      adb_enabled: platform === 'ANDROID' ? 'SUPPORTED' : 'NOT_AVAILABLE',
      unknown_sources: platform === 'ANDROID' ? 'SUPPORTED' : 'NOT_AVAILABLE',
      network_connectivity: 'SUPPORTED',
      vpn_detection: 'SUPPORTED',
      application_discovery: 'PARTIALLY_SUPPORTED',
      permission_discovery: 'PARTIALLY_SUPPORTED',
      wifi_ssid: 'PERMISSION_REQUIRED',
      hardware_attestation: 'UNABLE_TO_VERIFY',
    };
  }
}

export const deviceScanner = new DeviceScannerService();
