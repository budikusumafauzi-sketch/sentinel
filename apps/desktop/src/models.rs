use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Sentinel Data Trust Model (PRD Section 18).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DataTrustState {
    Verified,
    UserProvided,
    Analyzed,
    NotAvailable,
    PermissionRequired,
    UnableToVerify,
}

/// Platform capability availability.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum CapabilityStatus {
    Supported,
    PartiallySupported,
    NotAvailable,
    PermissionRequired,
    UnableToVerify,
}

/// Finding category enumeration matching `@sentinel/types`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum FindingCategory {
    System,
    Application,
    Network,
    Privacy,
    Authentication,
    Encryption,
    Permissions,
    Update,
    Configuration,
    Other,
}

/// Structured security evidence item with explicit provenance.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EvidenceItem {
    pub check_id: String,
    pub category: FindingCategory,
    pub check_name: String,
    pub value: serde_json::Value,
    pub trust_state: DataTrustState,
    pub source: String,
    pub platform: String,
    pub timestamp: String,
    pub capability_status: CapabilityStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permission: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permission_granted: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

/// Discovered software application evidence.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredAppEvidence {
    pub name: String,
    pub package_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version_name: Option<String>,
    pub is_system_app: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub install_source: Option<String>,
}

/// Discovered application inventory container.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationDiscovery {
    pub status: String,
    pub total_discovered: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limitation_reason: Option<String>,
    pub applications: Vec<DiscoveredAppEvidence>,
}

/// Normalized device metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInfo {
    pub manufacturer: String,
    pub model: String,
    pub os_version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub build_number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub architecture: Option<String>,
    pub is_emulator: bool,
    pub platform: String,
}

/// Complete device inspection result.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceInspectionResult {
    pub device_info: DeviceInfo,
    pub system_signals: HashMap<String, EvidenceItem>,
    pub application_discovery: ApplicationDiscovery,
    pub network_signals: HashMap<String, EvidenceItem>,
    pub capabilities: HashMap<String, CapabilityStatus>,
    pub inspected_at: String,
    pub raw_evidence: Vec<EvidenceItem>,
}

/// Payload sent to backend `/scans/:id/evidence`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncEvidenceInput {
    pub raw_evidence: Vec<EvidenceItem>,
    pub capabilities: HashMap<String, CapabilityStatus>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device_info: Option<SyncDeviceInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncDeviceInfo {
    pub manufacturer: String,
    pub model: String,
    pub os_version: String,
}

/// Input payload to register a device at `POST /devices`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDeviceInput {
    pub name: String,
    pub platform: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manufacturer: Option<String>,
}

/// Device record returned from `POST /devices`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceRecord {
    pub id: String,
    pub name: String,
    pub platform: String,
    #[serde(default)]
    pub os_version: Option<String>,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub manufacturer: Option<String>,
}

/// Input payload to create a scan at `POST /scans`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateScanInput {
    pub device_id: String,
    pub r#type: String,
}

/// Scan record returned from backend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanRecord {
    pub id: String,
    pub device_id: String,
    pub status: String,
    #[serde(default)]
    pub score: Option<f64>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub report: Option<serde_json::Value>,
}

/// Authenticated user token response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponseData {
    pub access_token: String,
    pub user: UserProfile,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
}

/// Standard API response envelope.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: T,
    pub timestamp: String,
}

/// Persisted session state on the local agent.
/// Security: NEVER contains passwords.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthSession {
    pub access_token: String,
    pub user_id: String,
    pub email: String,
    pub saved_at: String,
}

/// Login request received from local UI/IPC.
#[derive(Debug, Clone, Deserialize)]
pub struct LoginPayload {
    pub email: String,
    pub password: String,
}
