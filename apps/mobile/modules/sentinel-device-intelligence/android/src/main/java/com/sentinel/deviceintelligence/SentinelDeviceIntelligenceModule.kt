package com.sentinel.deviceintelligence

import android.app.KeyguardManager
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.provider.Settings
import androidx.biometric.BiometricManager
import androidx.core.content.pm.PackageInfoCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SentinelDeviceIntelligenceModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("React context not available")

  override fun definition() = ModuleDefinition {
    Name("SentinelDeviceIntelligence")

    AsyncFunction("getDeviceInfo") {
      val isEmulator = (
        Build.FINGERPRINT.startsWith("generic") ||
        Build.FINGERPRINT.startsWith("unknown") ||
        Build.MODEL.contains("google_sdk") ||
        Build.MODEL.contains("Emulator") ||
        Build.MODEL.contains("Android SDK built for x86") ||
        Build.MANUFACTURER.contains("Genymotion") ||
        (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
        "google_sdk" == Build.PRODUCT ||
        Build.HARDWARE.contains("goldfish") ||
        Build.HARDWARE.contains("ranchu")
      )

      mapOf(
        "manufacturer" to Build.MANUFACTURER,
        "model" to Build.MODEL,
        "brand" to Build.BRAND,
        "product" to Build.PRODUCT,
        "device" to Build.DEVICE,
        "hardware" to Build.HARDWARE,
        "id" to Build.ID,
        "tags" to Build.TAGS,
        "fingerprint" to Build.FINGERPRINT,
        "osVersion" to Build.VERSION.RELEASE,
        "apiLevel" to Build.VERSION.SDK_INT,
        "securityPatch" to (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) Build.VERSION.SECURITY_PATCH else null),
        "supportedAbis" to Build.SUPPORTED_ABIS.toList(),
        "isEmulator" to isEmulator
      )
    }

    AsyncFunction("getSystemSignals") {
      val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
      val isDeviceSecure = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        keyguardManager?.isDeviceSecure ?: false
      } else {
        keyguardManager?.isKeyguardSecure ?: false
      }
      val isKeyguardSecure = keyguardManager?.isKeyguardSecure ?: false
      val isDeviceLocked = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
        keyguardManager?.isDeviceLocked ?: false
      } else {
        false
      }

      val biometricStatus = try {
        val bm = BiometricManager.from(context)
        when (bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.BIOMETRIC_WEAK)) {
          BiometricManager.BIOMETRIC_SUCCESS -> "AVAILABLE"
          BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "NONE_ENROLLED"
          BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> "NO_HARDWARE"
          BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "HW_UNAVAILABLE"
          BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> "SECURITY_UPDATE_REQUIRED"
          else -> "UNKNOWN"
        }
      } catch (e: Exception) {
        "UNABLE_TO_VERIFY"
      }

      val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
      val encryptionStatus = when (devicePolicyManager?.storageEncryptionStatus) {
        DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE -> "ACTIVE"
        DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_DEFAULT_KEY -> "ACTIVE_DEFAULT_KEY"
        DevicePolicyManager.ENCRYPTION_STATUS_ACTIVE_PER_USER -> "ACTIVE_PER_USER"
        DevicePolicyManager.ENCRYPTION_STATUS_INACTIVE -> "INACTIVE"
        DevicePolicyManager.ENCRYPTION_STATUS_UNSUPPORTED -> "UNSUPPORTED"
        else -> "UNABLE_TO_VERIFY"
      }

      val devOptionsEnabled = try {
        Settings.Global.getInt(context.contentResolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) == 1
      } catch (e: Exception) {
        null
      }

      val adbEnabled = try {
        Settings.Global.getInt(context.contentResolver, Settings.Global.ADB_ENABLED, 0) == 1
      } catch (e: Exception) {
        null
      }

      val installNonMarketApps = try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.packageManager.canRequestPackageInstalls()
        } else {
          Settings.Secure.getInt(context.contentResolver, Settings.Secure.INSTALL_NON_MARKET_APPS, 0) == 1
        }
      } catch (e: Exception) {
        null
      }

      mapOf(
        "isDeviceSecure" to isDeviceSecure,
        "isKeyguardSecure" to isKeyguardSecure,
        "isDeviceLocked" to isDeviceLocked,
        "biometricStatus" to biometricStatus,
        "encryptionStatus" to encryptionStatus,
        "developerOptionsEnabled" to devOptionsEnabled,
        "adbEnabled" to adbEnabled,
        "installNonMarketAppsAllowed" to installNonMarketApps,
        "buildTags" to Build.TAGS
      )
    }

    AsyncFunction("getNetworkSignals") {
      val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
      val activeNetwork = cm?.activeNetwork
      val caps = cm?.getNetworkCapabilities(activeNetwork)

      val isConnected = activeNetwork != null && caps != null
      val hasInternet = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) ?: false
      val isValidated = caps?.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) ?: false
      val isVpn = caps?.hasTransport(NetworkCapabilities.TRANSPORT_VPN) ?: false
      val isWifi = caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ?: false
      val isCellular = caps?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ?: false
      val isEthernet = caps?.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) ?: false

      mapOf(
        "isConnected" to isConnected,
        "hasInternet" to hasInternet,
        "isValidated" to isValidated,
        "isVpn" to isVpn,
        "isWifi" to isWifi,
        "isCellular" to isCellular,
        "isEthernet" to isEthernet
      )
    }

    AsyncFunction("getInstalledApplications") {
      val pm = context.packageManager
      val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        PackageManager.GET_PERMISSIONS
      } else {
        @Suppress("DEPRECATION")
        PackageManager.GET_PERMISSIONS
      }

      val packages: List<PackageInfo> = try {
        pm.getInstalledPackages(flags)
      } catch (e: Exception) {
        emptyList()
      }

      val appList = mutableListOf<Map<String, Any?>>()
      for (pi in packages) {
        val appInfo = pi.applicationInfo ?: continue
        val appName = pm.getApplicationLabel(appInfo).toString()
        val packageName = pi.packageName
        val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0

        val installSource = try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            pm.getInstallSourceInfo(packageName).installingPackageName
          } else {
            @Suppress("DEPRECATION")
            pm.getInstallerPackageName(packageName)
          }
        } catch (e: Exception) {
          null
        }

        val rawReqPerms = pi.requestedPermissions
        val rawFlags = pi.requestedPermissionsFlags
        val requestedPermissions = rawReqPerms?.toList() ?: emptyList()
        val grantedPermissions = mutableListOf<String>()
        if (rawReqPerms != null && rawFlags != null) {
          for (i in rawReqPerms.indices) {
            if (i < rawFlags.size && (rawFlags[i] and PackageInfo.REQUESTED_PERMISSION_GRANTED) != 0) {
              grantedPermissions.add(rawReqPerms[i])
            }
          }
        }

        appList.add(
          mapOf(
            "name" to appName,
            "packageName" to packageName,
            "versionName" to pi.versionName,
            "versionCode" to PackageInfoCompat.getLongVersionCode(pi),
            "isSystemApp" to isSystem,
            "installSource" to installSource,
            "requestedPermissions" to requestedPermissions,
            "grantedPermissions" to grantedPermissions
          )
        )
      }

      val isFiltered = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
      mapOf(
        "status" to (if (isFiltered) "partially_discoverable" else "discovered"),
        "totalDiscovered" to appList.size,
        "limitationReason" to if (isFiltered) {
          "Android 11+ package visibility boundaries restrict full package enumeration for normal applications. Only packages visible under platform visibility rules are returned."
        } else {
          null
        },
        "applications" to appList
      )
    }

    AsyncFunction("getCapabilities") {
      mapOf(
        "device_metadata" to "SUPPORTED",
        "os_version" to "SUPPORTED",
        "security_patch" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) "SUPPORTED" else "NOT_AVAILABLE",
        "screen_lock" to "SUPPORTED",
        "biometrics" to "SUPPORTED",
        "encryption_status" to "SUPPORTED",
        "developer_options" to "SUPPORTED",
        "adb_enabled" to "SUPPORTED",
        "unknown_sources" to "SUPPORTED",
        "network_connectivity" to "SUPPORTED",
        "vpn_detection" to "SUPPORTED",
        "application_discovery" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) "PARTIALLY_SUPPORTED" else "SUPPORTED",
        "permission_discovery" to if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) "PARTIALLY_SUPPORTED" else "SUPPORTED",
        "wifi_ssid" to "PERMISSION_REQUIRED",
        "hardware_attestation" to "UNABLE_TO_VERIFY"
      )
    }
  }
}
