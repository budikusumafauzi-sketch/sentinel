use crate::models::{CapabilityStatus, DataTrustState, EvidenceItem, FindingCategory};
use chrono::Utc;
use std::process::Command;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

/// Inspects security-relevant Windows settings with honest provenance.
pub fn inspect_security() -> Vec<EvidenceItem> {
    let mut evidence = Vec::new();
    let now = Utc::now().to_rfc3339();

    evidence.push(inspect_firewall(&now));
    evidence.push(inspect_antivirus(&now));
    evidence.push(inspect_uac(&now));
    evidence.push(inspect_secure_boot(&now));
    evidence.push(inspect_tpm(&now));
    evidence.push(inspect_storage_encryption(&now));
    evidence.push(inspect_screen_lock(&now));

    evidence
}

/// 1. Windows Firewall Status
fn inspect_firewall(now: &str) -> EvidenceItem {
    let output = Command::new("netsh")
        .args(["advfirewall", "show", "allprofiles", "state"])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut has_off = false;
            let mut has_on = false;

            for line in stdout.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    let first = parts[0].to_lowercase();
                    let last = parts[parts.len() - 1].to_lowercase();
                    if first == "state" || first == "keadaan" {
                        if last == "off" || last == "nonaktif" {
                            has_off = true;
                        } else if last == "on" || last == "aktif" {
                            has_on = true;
                        }
                    }
                }
            }

            if has_off {
                EvidenceItem {
                    check_id: "security.firewall_active".to_string(),
                    category: FindingCategory::Network,
                    check_name: "Windows Firewall State".to_string(),
                    value: serde_json::json!(false),
                    trust_state: DataTrustState::Verified,
                    source: "netsh:advfirewall:show allprofiles state".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("One or more Windows firewall profiles are disabled".to_string()),
                }
            } else if has_on {
                EvidenceItem {
                    check_id: "security.firewall_active".to_string(),
                    category: FindingCategory::Network,
                    check_name: "Windows Firewall State".to_string(),
                    value: serde_json::json!(true),
                    trust_state: DataTrustState::Verified,
                    source: "netsh:advfirewall:show allprofiles state".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "All active firewall profiles are enabled and filtering traffic"
                            .to_string(),
                    ),
                }
            } else {
                EvidenceItem {
                    check_id: "security.firewall_active".to_string(),
                    category: FindingCategory::Network,
                    check_name: "Windows Firewall State".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::UnableToVerify,
                    source: "netsh:advfirewall:show allprofiles state".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::UnableToVerify,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("Unable to parse firewall profile status output".to_string()),
                }
            }
        }
        Err(e) => EvidenceItem {
            check_id: "security.firewall_active".to_string(),
            category: FindingCategory::Network,
            check_name: "Windows Firewall State".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::UnableToVerify,
            source: "netsh:advfirewall".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::UnableToVerify,
            permission: None,
            permission_granted: Some(true),
            notes: Some(format!("Firewall query failed: {}", e)),
        },
    }
}

/// 2. Real-Time Antivirus Protection (Defender / AV)
fn inspect_antivirus(now: &str) -> EvidenceItem {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "(Get-MpComputerStatus | Select-Object -Property RealTimeProtectionEnabled, AntivirusEnabled) | ConvertTo-Json -Compress",
        ])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&stdout) {
                let rtp = val
                    .get("RealTimeProtectionEnabled")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                let av = val
                    .get("AntivirusEnabled")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                let is_active = rtp && av;

                return EvidenceItem {
                    check_id: "security.realtime_protection".to_string(),
                    category: FindingCategory::System,
                    check_name: "Real-Time Antivirus Protection".to_string(),
                    value: serde_json::json!(is_active),
                    trust_state: DataTrustState::Verified,
                    source: "powershell:Get-MpComputerStatus".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(format!(
                        "Real-Time Protection: {}, Antivirus Enabled: {}",
                        rtp, av
                    )),
                };
            }

            EvidenceItem {
                check_id: "security.realtime_protection".to_string(),
                category: FindingCategory::System,
                check_name: "Real-Time Antivirus Protection".to_string(),
                value: serde_json::Value::Null,
                trust_state: DataTrustState::NotAvailable,
                source: "powershell:Get-MpComputerStatus".to_string(),
                platform: "WINDOWS".to_string(),
                timestamp: now.to_string(),
                capability_status: CapabilityStatus::NotAvailable,
                permission: None,
                permission_granted: Some(true),
                notes: Some(
                    "Microsoft Defender status not accessible or managed by third-party EDR"
                        .to_string(),
                ),
            }
        }
        Err(e) => EvidenceItem {
            check_id: "security.realtime_protection".to_string(),
            category: FindingCategory::System,
            check_name: "Real-Time Antivirus Protection".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::UnableToVerify,
            source: "powershell:Get-MpComputerStatus".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::UnableToVerify,
            permission: None,
            permission_granted: Some(true),
            notes: Some(format!("Query failed: {}", e)),
        },
    }
}

/// 3. User Account Control (UAC)
fn inspect_uac(now: &str) -> EvidenceItem {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let uac_key = hklm.open_subkey(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System");

    match uac_key {
        Ok(key) => {
            let enable_lua: Result<u32, _> = key.get_value("EnableLUA");
            match enable_lua {
                Ok(1) => EvidenceItem {
                    check_id: "security.uac_enabled".to_string(),
                    category: FindingCategory::System,
                    check_name: "User Account Control (UAC)".to_string(),
                    value: serde_json::json!(true),
                    trust_state: DataTrustState::Verified,
                    source:
                        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:EnableLUA"
                            .to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "UAC is enabled with administrative elevation prompt verification"
                            .to_string(),
                    ),
                },
                Ok(0) => EvidenceItem {
                    check_id: "security.uac_enabled".to_string(),
                    category: FindingCategory::System,
                    check_name: "User Account Control (UAC)".to_string(),
                    value: serde_json::json!(false),
                    trust_state: DataTrustState::Verified,
                    source:
                        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System:EnableLUA"
                            .to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("UAC is turned off (EnableLUA = 0)".to_string()),
                },
                _ => EvidenceItem {
                    check_id: "security.uac_enabled".to_string(),
                    category: FindingCategory::System,
                    check_name: "User Account Control (UAC)".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::UnableToVerify,
                    source: r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System"
                        .to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::UnableToVerify,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("EnableLUA registry value not found or unreadable".to_string()),
                },
            }
        }
        Err(e) => EvidenceItem {
            check_id: "security.uac_enabled".to_string(),
            category: FindingCategory::System,
            check_name: "User Account Control (UAC)".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::UnableToVerify,
            source: r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::UnableToVerify,
            permission: None,
            permission_granted: Some(true),
            notes: Some(format!("UAC registry key unreadable: {}", e)),
        },
    }
}

/// 4. Secure Boot Status
fn inspect_secure_boot(now: &str) -> EvidenceItem {
    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let sb_key = hklm.open_subkey(r"SYSTEM\CurrentControlSet\Control\SecureBoot\State");

    match sb_key {
        Ok(key) => {
            let val: Result<u32, _> = key.get_value("UEFISecureBootEnabled");
            match val {
                Ok(1) => EvidenceItem {
                    check_id: "security.secure_boot".to_string(),
                    category: FindingCategory::System,
                    check_name: "UEFI Secure Boot".to_string(),
                    value: serde_json::json!(true),
                    trust_state: DataTrustState::Verified,
                    source: r"HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State:UEFISecureBootEnabled".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("UEFI Secure Boot is active and verified by firmware".to_string()),
                },
                Ok(0) => EvidenceItem {
                    check_id: "security.secure_boot".to_string(),
                    category: FindingCategory::System,
                    check_name: "UEFI Secure Boot".to_string(),
                    value: serde_json::json!(false),
                    trust_state: DataTrustState::Verified,
                    source: r"HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State:UEFISecureBootEnabled".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("UEFI Secure Boot is disabled in firmware configuration".to_string()),
                },
                _ => EvidenceItem {
                    check_id: "security.secure_boot".to_string(),
                    category: FindingCategory::System,
                    check_name: "UEFI Secure Boot".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::NotAvailable,
                    source: r"HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::NotAvailable,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("Secure Boot state not found (Legacy BIOS or VM without EFI)".to_string()),
                },
            }
        }
        Err(_) => EvidenceItem {
            check_id: "security.secure_boot".to_string(),
            category: FindingCategory::System,
            check_name: "UEFI Secure Boot".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::NotAvailable,
            source: r"HKLM\SYSTEM\CurrentControlSet\Control\SecureBoot\State".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::NotAvailable,
            permission: None,
            permission_granted: Some(true),
            notes: Some("SecureBoot registry state not found on this system".to_string()),
        },
    }
}

/// 5. TPM Security Hardware
fn inspect_tpm(now: &str) -> EvidenceItem {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "try { (Get-Tpm).TpmPresent } catch { 'ERROR' }",
        ])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if stdout.eq_ignore_ascii_case("true") {
                EvidenceItem {
                    check_id: "security.tpm_present".to_string(),
                    category: FindingCategory::System,
                    check_name: "TPM Hardware Security Module".to_string(),
                    value: serde_json::json!(true),
                    trust_state: DataTrustState::Verified,
                    source: "powershell:Get-Tpm".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "Trusted Platform Module (TPM) is present and recognized by Windows"
                            .to_string(),
                    ),
                }
            } else if stdout.eq_ignore_ascii_case("false") {
                EvidenceItem {
                    check_id: "security.tpm_present".to_string(),
                    category: FindingCategory::System,
                    check_name: "TPM Hardware Security Module".to_string(),
                    value: serde_json::json!(false),
                    trust_state: DataTrustState::Verified,
                    source: "powershell:Get-Tpm".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "No Trusted Platform Module (TPM) detected on this hardware".to_string(),
                    ),
                }
            } else {
                EvidenceItem {
                    check_id: "security.tpm_present".to_string(),
                    category: FindingCategory::System,
                    check_name: "TPM Hardware Security Module".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::NotAvailable,
                    source: "powershell:Get-Tpm".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::NotAvailable,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some("TPM status query not supported or module unavailable".to_string()),
                }
            }
        }
        Err(e) => EvidenceItem {
            check_id: "security.tpm_present".to_string(),
            category: FindingCategory::System,
            check_name: "TPM Hardware Security Module".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::UnableToVerify,
            source: "powershell:Get-Tpm".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::UnableToVerify,
            permission: None,
            permission_granted: Some(true),
            notes: Some(format!("TPM query failed: {}", e)),
        },
    }
}

/// 6. BitLocker Drive / Storage Encryption
fn inspect_storage_encryption(now: &str) -> EvidenceItem {
    let output = Command::new("manage-bde").args(["-status", "C:"]).output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let stderr = String::from_utf8_lossy(&out.stderr);
            let combined = format!("{}\n{}", stdout, stderr).to_lowercase();

            if combined.contains("access is denied")
                || combined.contains("akses ditolak")
                || combined.contains("error_access_denied")
            {
                return EvidenceItem {
                    check_id: "security.storage_encryption".to_string(),
                    category: FindingCategory::Encryption,
                    check_name: "Drive Storage Encryption (BitLocker)".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::PermissionRequired,
                    source: "manage-bde:status C:".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::PermissionRequired,
                    permission: Some("Elevation (Run as Administrator)".to_string()),
                    permission_granted: Some(false),
                    notes: Some("Reading detailed BitLocker volume encryption keys requires administrative elevation".to_string()),
                };
            }

            let is_encrypted = combined.contains("protection on")
                || combined.contains("perlindungan aktif")
                || combined.contains("100% terenkripsi")
                || combined.contains("100% encrypted")
                || combined.contains("fully encrypted");
            let is_decrypted = combined.contains("protection off")
                || combined.contains("perlindungan nonaktif")
                || combined.contains("fully decrypted")
                || combined.contains("tidak terenkripsi");

            if is_encrypted {
                EvidenceItem {
                    check_id: "security.storage_encryption".to_string(),
                    category: FindingCategory::Encryption,
                    check_name: "Drive Storage Encryption (BitLocker)".to_string(),
                    value: serde_json::json!(true),
                    trust_state: DataTrustState::Verified,
                    source: "manage-bde:status C:".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "System drive C: is protected by BitLocker volume encryption".to_string(),
                    ),
                }
            } else if is_decrypted {
                EvidenceItem {
                    check_id: "security.storage_encryption".to_string(),
                    category: FindingCategory::Encryption,
                    check_name: "Drive Storage Encryption (BitLocker)".to_string(),
                    value: serde_json::json!(false),
                    trust_state: DataTrustState::Verified,
                    source: "manage-bde:status C:".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::Supported,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "System drive C: storage encryption is inactive or disabled".to_string(),
                    ),
                }
            } else {
                EvidenceItem {
                    check_id: "security.storage_encryption".to_string(),
                    category: FindingCategory::Encryption,
                    check_name: "Drive Storage Encryption (BitLocker)".to_string(),
                    value: serde_json::Value::Null,
                    trust_state: DataTrustState::NotAvailable,
                    source: "manage-bde:status C:".to_string(),
                    platform: "WINDOWS".to_string(),
                    timestamp: now.to_string(),
                    capability_status: CapabilityStatus::NotAvailable,
                    permission: None,
                    permission_granted: Some(true),
                    notes: Some(
                        "BitLocker not available on this Windows edition or drive".to_string(),
                    ),
                }
            }
        }
        Err(_) => EvidenceItem {
            check_id: "security.storage_encryption".to_string(),
            category: FindingCategory::Encryption,
            check_name: "Drive Storage Encryption (BitLocker)".to_string(),
            value: serde_json::Value::Null,
            trust_state: DataTrustState::NotAvailable,
            source: "manage-bde".to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.to_string(),
            capability_status: CapabilityStatus::NotAvailable,
            permission: None,
            permission_granted: Some(true),
            notes: Some("manage-bde utility not found on system path".to_string()),
        },
    }
}

/// 7. Screen Lock / Password Requirement
fn inspect_screen_lock(now: &str) -> EvidenceItem {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let desktop_key = hkcu.open_subkey(r"Control Panel\Desktop");

    let is_secure: Option<String> = desktop_key
        .as_ref()
        .ok()
        .and_then(|k| k.get_value("ScreenSaverIsSecure").ok());

    let screen_saver_active: Option<String> = desktop_key
        .as_ref()
        .ok()
        .and_then(|k| k.get_value("ScreenSaveActive").ok());

    let has_lock = match (screen_saver_active.as_deref(), is_secure.as_deref()) {
        (Some("1"), Some("1")) => true,
        _ => {
            // Also check Windows password policy or Lock on Sleep
            let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
            let password_policy = hklm.open_subkey(r"SOFTWARE\Policies\Microsoft\Power\PowerSettings\0e796bdb-100d-47d6-a2d5-f7d2daa51f51");
            matches!(
                password_policy.and_then(|p| p.get_value::<u32, _>("ACSettingIndex")),
                Ok(1)
            )
        }
    };

    EvidenceItem {
        check_id: "security.screen_lock".to_string(),
        category: FindingCategory::Authentication,
        check_name: "Screen Lock / Password on Wake".to_string(),
        value: serde_json::json!(has_lock),
        trust_state: DataTrustState::Verified,
        source: r"HKCU\Control Panel\Desktop:ScreenSaverIsSecure".to_string(),
        platform: "WINDOWS".to_string(),
        timestamp: now.to_string(),
        capability_status: CapabilityStatus::Supported,
        permission: None,
        permission_granted: Some(true),
        notes: if has_lock {
            Some("Screen lock or password prompt is required upon device inactivity".to_string())
        } else {
            Some("No password-protected screen saver or inactivity lock configured".to_string())
        },
    }
}
