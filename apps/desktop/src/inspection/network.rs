use crate::models::{CapabilityStatus, DataTrustState, EvidenceItem, FindingCategory};
use chrono::Utc;
use std::process::Command;

/// Inspects safe read-only network interfaces and adapter states.
pub fn inspect_network() -> Vec<EvidenceItem> {
    let now = Utc::now().to_rfc3339();
    let mut evidence = Vec::new();

    let output = Command::new("netsh")
        .args(["interface", "show", "interface"])
        .output();

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            let mut interfaces = Vec::new();

            for line in stdout.lines() {
                let trimmed = line.trim();
                // Filter table header lines
                if trimmed.is_empty()
                    || trimmed.starts_with("Admin State")
                    || trimmed.starts_with("-------")
                {
                    continue;
                }

                // Typical line format:
                // Enabled        Connected      Dedicated      Wi-Fi
                // Enabled        Disconnected   Dedicated      Ethernet
                let parts: Vec<&str> = trimmed.split_whitespace().collect();
                if parts.len() >= 4 {
                    let admin_state = parts[0];
                    let conn_state = parts[1];
                    let if_type = parts[2];
                    let if_name = parts[3..].join(" ");

                    interfaces.push(serde_json::json!({
                        "name": if_name,
                        "adminState": admin_state,
                        "connectionState": conn_state,
                        "interfaceType": if_type,
                        "isConnected": conn_state.eq_ignore_ascii_case("Connected") || conn_state.eq_ignore_ascii_case("Tersambung"),
                    }));
                }
            }

            let connected_count = interfaces
                .iter()
                .filter(|i| {
                    i.get("isConnected")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false)
                })
                .count();

            evidence.push(EvidenceItem {
                check_id: "network.interfaces".to_string(),
                category: FindingCategory::Network,
                check_name: "Network Adapters & Connectivity".to_string(),
                value: serde_json::json!({
                    "totalAdapters": interfaces.len(),
                    "connectedAdapters": connected_count,
                    "adapters": interfaces,
                }),
                trust_state: DataTrustState::Verified,
                source: "netsh:interface:show interface".to_string(),
                platform: "WINDOWS".to_string(),
                timestamp: now.clone(),
                capability_status: CapabilityStatus::Supported,
                permission: None,
                permission_granted: Some(true),
                notes: Some(format!(
                    "Discovered {} network adapters ({} active)",
                    interfaces.len(),
                    connected_count
                )),
            });
        }
        Err(e) => {
            evidence.push(EvidenceItem {
                check_id: "network.interfaces".to_string(),
                category: FindingCategory::Network,
                check_name: "Network Adapters & Connectivity".to_string(),
                value: serde_json::Value::Null,
                trust_state: DataTrustState::UnableToVerify,
                source: "netsh:interface".to_string(),
                platform: "WINDOWS".to_string(),
                timestamp: now.clone(),
                capability_status: CapabilityStatus::UnableToVerify,
                permission: None,
                permission_granted: Some(true),
                notes: Some(format!("Failed to query network interfaces: {}", e)),
            });
        }
    }

    evidence
}
