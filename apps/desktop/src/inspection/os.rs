use crate::models::{CapabilityStatus, DataTrustState, DeviceInfo, EvidenceItem, FindingCategory};
use chrono::Utc;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;

/// Collects authoritative Windows OS and system identification signals.
pub fn inspect_os() -> (DeviceInfo, Vec<EvidenceItem>) {
    let mut evidence = Vec::new();
    let now = Utc::now().to_rfc3339();

    let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
    let nt_key = hklm
        .open_subkey(r"SOFTWARE\Microsoft\Windows NT\CurrentVersion")
        .ok();

    let product_name: String = nt_key
        .as_ref()
        .and_then(|k| k.get_value("ProductName").ok())
        .unwrap_or_else(|| "Windows".to_string());

    let display_version: String = nt_key
        .as_ref()
        .and_then(|k| k.get_value("DisplayVersion").ok())
        .unwrap_or_default();

    let current_build: String = nt_key
        .as_ref()
        .and_then(|k| k.get_value("CurrentBuildNumber").ok())
        .unwrap_or_default();

    let ubr: u32 = nt_key
        .as_ref()
        .and_then(|k| k.get_value("UBR").ok())
        .unwrap_or(0);

    let architecture =
        std::env::var("PROCESSOR_ARCHITECTURE").unwrap_or_else(|_| "x86_64".to_string());

    // Construct OS string (e.g., "Windows 11 Pro 23H2 (Build 22631)") bounded to 50 chars
    let mut os_version = product_name.clone();
    if !display_version.is_empty() {
        let with_display = format!("{} {}", os_version, display_version);
        if with_display.len() <= 50 {
            os_version = with_display;
        }
    }
    if !current_build.is_empty() {
        let build_str = if ubr > 0 {
            format!(" (Build {}.{})", current_build, ubr)
        } else {
            format!(" (Build {})", current_build)
        };
        if os_version.len() + build_str.len() <= 50 {
            os_version.push_str(&build_str);
        }
    }
    if os_version.len() > 50 {
        os_version = os_version.chars().take(50).collect();
    }

    let manufacturer = read_system_manufacturer(&hklm).unwrap_or_else(|| "Microsoft".to_string());
    let model = read_system_model(&hklm).unwrap_or_else(|| "Windows PC".to_string());

    // 1. Evidence: OS Version
    evidence.push(EvidenceItem {
        check_id: "os.version".to_string(),
        category: FindingCategory::System,
        check_name: "Operating System Version".to_string(),
        value: serde_json::Value::String(os_version.clone()),
        trust_state: DataTrustState::Verified,
        source: r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion".to_string(),
        platform: "WINDOWS".to_string(),
        timestamp: now.clone(),
        capability_status: CapabilityStatus::Supported,
        permission: None,
        permission_granted: Some(true),
        notes: None,
    });

    // 2. Evidence: Build Number
    if !current_build.is_empty() {
        evidence.push(EvidenceItem {
            check_id: "os.build_number".to_string(),
            category: FindingCategory::System,
            check_name: "Windows Build Number".to_string(),
            value: serde_json::Value::String(current_build.clone()),
            trust_state: DataTrustState::Verified,
            source: r"HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion:CurrentBuildNumber"
                .to_string(),
            platform: "WINDOWS".to_string(),
            timestamp: now.clone(),
            capability_status: CapabilityStatus::Supported,
            permission: None,
            permission_granted: Some(true),
            notes: None,
        });
    }

    // 3. Evidence: Architecture
    evidence.push(EvidenceItem {
        check_id: "os.architecture".to_string(),
        category: FindingCategory::System,
        check_name: "System Architecture".to_string(),
        value: serde_json::Value::String(architecture.clone()),
        trust_state: DataTrustState::Verified,
        source: "env:PROCESSOR_ARCHITECTURE".to_string(),
        platform: "WINDOWS".to_string(),
        timestamp: now.clone(),
        capability_status: CapabilityStatus::Supported,
        permission: None,
        permission_granted: Some(true),
        notes: None,
    });

    // 4. Evidence: System Uptime (seconds)
    let uptime_sec = unsafe {
        #[link(name = "kernel32")]
        extern "system" {
            fn GetTickCount64() -> u64;
        }
        GetTickCount64() / 1000
    };
    evidence.push(EvidenceItem {
        check_id: "system.uptime".to_string(),
        category: FindingCategory::System,
        check_name: "System Uptime".to_string(),
        value: serde_json::json!(uptime_sec),
        trust_state: DataTrustState::Verified,
        source: "kernel32.dll:GetTickCount64".to_string(),
        platform: "WINDOWS".to_string(),
        timestamp: now,
        capability_status: CapabilityStatus::Supported,
        permission: None,
        permission_granted: Some(true),
        notes: Some(format!(
            "System has been active for {} hours",
            uptime_sec / 3600
        )),
    });

    let device_info = DeviceInfo {
        manufacturer,
        model,
        os_version,
        build_number: if current_build.is_empty() {
            None
        } else {
            Some(current_build)
        },
        architecture: Some(architecture),
        is_emulator: false,
        platform: "WINDOWS".to_string(),
    };

    (device_info, evidence)
}

fn read_system_manufacturer(hklm: &RegKey) -> Option<String> {
    let bios_key = hklm.open_subkey(r"HARDWARE\DESCRIPTION\System\BIOS").ok()?;
    bios_key.get_value("SystemManufacturer").ok()
}

fn read_system_model(hklm: &RegKey) -> Option<String> {
    let bios_key = hklm.open_subkey(r"HARDWARE\DESCRIPTION\System\BIOS").ok()?;
    bios_key.get_value("SystemProductName").ok()
}
