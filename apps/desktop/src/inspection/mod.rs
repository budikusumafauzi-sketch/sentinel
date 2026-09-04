pub mod apps;
pub mod network;
pub mod os;
pub mod security;

use crate::models::{
    CapabilityStatus, DeviceInspectionResult, EvidenceItem, SyncDeviceInfo, SyncEvidenceInput,
};
use chrono::Utc;
use std::collections::HashMap;

/// Runs the complete, read-only Windows security inspection suite.
/// Error isolation: failures in any individual check do not abort or corrupt the rest of the scan.
pub fn run_full_inspection() -> (DeviceInspectionResult, SyncEvidenceInput) {
    let now = Utc::now().to_rfc3339();

    // 1. OS & Identity signals
    let (device_info, os_evidence) = os::inspect_os();

    // 2. Security configuration signals
    let sec_evidence = security::inspect_security();

    // 3. Application inventory
    let (app_discovery, app_evidence) = apps::inspect_installed_apps();

    // 4. Network signals
    let net_evidence = network::inspect_network();

    // Aggregate all raw evidence items
    let mut all_evidence: Vec<EvidenceItem> = Vec::new();
    all_evidence.extend(os_evidence.clone());
    all_evidence.extend(sec_evidence.clone());
    all_evidence.extend(app_evidence.clone());
    all_evidence.extend(net_evidence.clone());

    let mut system_signals = HashMap::new();
    for ev in &os_evidence {
        system_signals.insert(ev.check_id.clone(), ev.clone());
    }
    for ev in &sec_evidence {
        if ev.category != crate::models::FindingCategory::Network {
            system_signals.insert(ev.check_id.clone(), ev.clone());
        }
    }

    let mut network_signals = HashMap::new();
    for ev in &net_evidence {
        network_signals.insert(ev.check_id.clone(), ev.clone());
    }
    for ev in &sec_evidence {
        if ev.category == crate::models::FindingCategory::Network {
            network_signals.insert(ev.check_id.clone(), ev.clone());
        }
    }

    // Build platform capability availability matrix
    let mut capabilities = HashMap::new();
    capabilities.insert("device_metadata".to_string(), CapabilityStatus::Supported);
    capabilities.insert(
        "application_inventory".to_string(),
        CapabilityStatus::Supported,
    );
    capabilities.insert("network_adapters".to_string(), CapabilityStatus::Supported);

    for ev in &all_evidence {
        let cap_key = ev.check_id.replace('.', "_");
        capabilities.insert(cap_key, ev.capability_status.clone());
    }

    let inspection_result = DeviceInspectionResult {
        device_info: device_info.clone(),
        system_signals,
        application_discovery: app_discovery.clone(),
        network_signals,
        capabilities: capabilities.clone(),
        inspected_at: now,
        raw_evidence: all_evidence.clone(),
    };

    let sync_input = SyncEvidenceInput {
        raw_evidence: all_evidence.clone(),
        capabilities,
        device_info: Some(SyncDeviceInfo {
            manufacturer: device_info.manufacturer,
            model: device_info.model,
            os_version: device_info.os_version,
        }),
        summary: Some(format!(
            "Windows inspection completed: {} security checks executed, {} applications indexed",
            all_evidence.len(),
            app_discovery.total_discovered
        )),
    };

    (inspection_result, sync_input)
}
