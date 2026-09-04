use crate::models::{
    ApplicationDiscovery, CapabilityStatus, DataTrustState, DiscoveredAppEvidence, EvidenceItem,
    FindingCategory,
};
use chrono::Utc;
use std::collections::HashSet;
use winreg::enums::{HKEY_CURRENT_USER, HKEY_LOCAL_MACHINE};
use winreg::RegKey;

/// Discovers installed desktop applications via legitimate Windows Uninstall registry keys.
pub fn inspect_installed_apps() -> (ApplicationDiscovery, Vec<EvidenceItem>) {
    let now = Utc::now().to_rfc3339();
    let mut discovered_apps = Vec::new();
    let mut seen_names = HashSet::new();

    let registry_targets = [
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:64bit",
        ),
        (
            HKEY_LOCAL_MACHINE,
            r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKLM:32bit",
        ),
        (
            HKEY_CURRENT_USER,
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
            "HKCU:User",
        ),
    ];

    for (root_key, subpath, source_tag) in registry_targets {
        let root = RegKey::predef(root_key);
        if let Ok(uninstall_key) = root.open_subkey(subpath) {
            for subkey_name in uninstall_key.enum_keys().filter_map(|k| k.ok()) {
                if let Ok(app_key) = uninstall_key.open_subkey(&subkey_name) {
                    // Check if it's marked as an internal system component
                    let is_system_component: u32 =
                        app_key.get_value("SystemComponent").unwrap_or(0);
                    if is_system_component == 1 {
                        continue;
                    }

                    // Check if it's a Windows Update KB patch
                    let parent_key_name: String =
                        app_key.get_value("ParentKeyName").unwrap_or_default();
                    if !parent_key_name.is_empty() {
                        continue;
                    }

                    let display_name: String = match app_key.get_value("DisplayName") {
                        Ok(name) => name,
                        Err(_) => continue, // Skip entries without display name
                    };

                    let clean_name = display_name.trim().to_string();
                    if clean_name.is_empty() || seen_names.contains(&clean_name) {
                        continue;
                    }
                    seen_names.insert(clean_name.clone());

                    let display_version: Option<String> = app_key.get_value("DisplayVersion").ok();
                    let publisher: Option<String> = app_key.get_value("Publisher").ok();
                    let install_source: Option<String> = app_key.get_value("InstallSource").ok();

                    discovered_apps.push(DiscoveredAppEvidence {
                        name: clean_name,
                        package_name: subkey_name,
                        version_name: display_version,
                        is_system_app: false,
                        install_source: install_source
                            .or(publisher)
                            .or_else(|| Some(source_tag.to_string())),
                    });
                }
            }
        }
    }

    discovered_apps.sort_by_key(|a| a.name.to_lowercase());
    let total_discovered = discovered_apps.len();

    let app_discovery = ApplicationDiscovery {
        status: "discovered".to_string(),
        total_discovered,
        limitation_reason: Some("Discovered software registered in Windows Uninstall registry database; standalone portable binaries without installers are excluded".to_string()),
        applications: discovered_apps.clone(),
    };

    let mut evidence = Vec::new();

    // 1. apps.inventory evidence item
    evidence.push(EvidenceItem {
        check_id: "apps.inventory".to_string(),
        category: FindingCategory::Application,
        check_name: "Installed Software Inventory".to_string(),
        value: serde_json::json!({
            "totalCount": total_discovered,
            "sampleCount": total_discovered.min(10),
            "applications": discovered_apps.iter().take(50).collect::<Vec<_>>(),
        }),
        trust_state: DataTrustState::Verified,
        source: "Windows:Registry:Uninstall".to_string(),
        platform: "WINDOWS".to_string(),
        timestamp: now,
        capability_status: CapabilityStatus::Supported,
        permission: None,
        permission_granted: Some(true),
        notes: Some(format!(
            "Discovered {} installed applications from system and user registries",
            total_discovered
        )),
    });

    (app_discovery, evidence)
}
