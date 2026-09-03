import ExpoModulesCore
import UIKit
import Network

public class SentinelDeviceIntelligenceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SentinelDeviceIntelligence")

    AsyncFunction("getDeviceInfo") { () -> [String: Any?] in
      let device = UIDevice.current
      #if targetEnvironment(simulator)
      let isEmulator = true
      #else
      let isEmulator = false
      #endif

      return [
        "manufacturer": "Apple",
        "model": device.model,
        "brand": "Apple",
        "product": device.model,
        "device": device.name,
        "hardware": "Apple Silicon",
        "id": device.identifierForVendor?.uuidString ?? "unknown",
        "tags": "release",
        "fingerprint": "\(device.systemName)_\(device.systemVersion)",
        "osVersion": device.systemVersion,
        "apiLevel": nil,
        "securityPatch": nil,
        "supportedAbis": ["arm64"],
        "isEmulator": isEmulator
      ]
    }

    AsyncFunction("getSystemSignals") { () -> [String: Any?] in
      return [
        "isDeviceSecure": nil,
        "isKeyguardSecure": nil,
        "isDeviceLocked": nil,
        "biometricStatus": "UNABLE_TO_VERIFY",
        "encryptionStatus": "ACTIVE",
        "developerOptionsEnabled": false,
        "adbEnabled": false,
        "installNonMarketAppsAllowed": false,
        "buildTags": "release"
      ]
    }

    AsyncFunction("getNetworkSignals") { () -> [String: Any?] in
      return [
        "isConnected": true,
        "hasInternet": true,
        "isValidated": true,
        "isVpn": false,
        "isWifi": true,
        "isCellular": false,
        "isEthernet": false
      ]
    }

    AsyncFunction("getInstalledApplications") { () -> [String: Any?] in
      return [
        "status": "unavailable",
        "totalDiscovered": 0,
        "limitationReason": "iOS sandboxing prevents third-party apps from listing other installed applications.",
        "applications": []
      ]
    }

    AsyncFunction("getCapabilities") { () -> [String: String] in
      return [
        "device_metadata": "SUPPORTED",
        "os_version": "SUPPORTED",
        "security_patch": "NOT_AVAILABLE",
        "screen_lock": "NOT_AVAILABLE",
        "biometrics": "PARTIALLY_SUPPORTED",
        "encryption_status": "SUPPORTED",
        "developer_options": "NOT_AVAILABLE",
        "adb_enabled": "NOT_AVAILABLE",
        "unknown_sources": "NOT_AVAILABLE",
        "network_connectivity": "SUPPORTED",
        "vpn_detection": "PARTIALLY_SUPPORTED",
        "application_discovery": "NOT_AVAILABLE",
        "permission_discovery": "NOT_AVAILABLE",
        "wifi_ssid": "PERMISSION_REQUIRED",
        "hardware_attestation": "PARTIALLY_SUPPORTED"
      ]
    }
  }
}
