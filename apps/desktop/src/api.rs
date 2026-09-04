use crate::models::{
    ApiResponse, AuthResponseData, CreateDeviceInput, CreateScanInput, DeviceRecord, ScanRecord,
    SyncEvidenceInput,
};
use reqwest::Client;
use std::time::Duration;

#[derive(Clone)]
pub struct SentinelApiClient {
    base_url: String,
    client: Client,
}

impl SentinelApiClient {
    pub fn new(base_url: Option<&str>) -> Self {
        let base_url = base_url
            .unwrap_or("http://localhost:3000/api/v1")
            .trim_end_matches('/')
            .to_string();

        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { base_url, client }
    }

    /// Authenticates with user credentials.
    pub async fn login(&self, email: &str, password: &str) -> Result<AuthResponseData, String> {
        let url = format!("{}/auth/login", self.base_url);
        let payload = serde_json::json!({
            "email": email,
            "password": password
        });

        let resp = self
            .client
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Network request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(format!("Login failed ({}): {}", status, err_text));
        }

        let envelope: ApiResponse<AuthResponseData> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse auth response: {}", e))?;

        Ok(envelope.data)
    }

    /// Registers a new user account.
    #[allow(dead_code)]
    pub async fn register(
        &self,
        email: &str,
        password: &str,
        name: Option<&str>,
    ) -> Result<AuthResponseData, String> {
        let url = format!("{}/auth/register", self.base_url);
        let payload = serde_json::json!({
            "email": email,
            "password": password,
            "name": name
        });

        let resp = self
            .client
            .post(&url)
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Network request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(format!("Registration failed ({}): {}", status, err_text));
        }

        let envelope: ApiResponse<AuthResponseData> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse register response: {}", e))?;

        Ok(envelope.data)
    }

    /// Validates an existing access token and retrieves current user profile.
    pub async fn get_current_user(
        &self,
        token: &str,
    ) -> Result<crate::models::UserProfile, String> {
        let url = format!("{}/auth/me", self.base_url);

        let resp = self
            .client
            .get(&url)
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| format!("Network request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            return Err(format!("Token validation failed ({})", status));
        }

        let envelope: ApiResponse<crate::models::UserProfile> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse profile response: {}", e))?;

        Ok(envelope.data)
    }

    /// Registers the Windows device under the authenticated account.
    pub async fn register_device(
        &self,
        token: &str,
        input: &CreateDeviceInput,
    ) -> Result<DeviceRecord, String> {
        let url = format!("{}/devices", self.base_url);

        let resp = self
            .client
            .post(&url)
            .bearer_auth(token)
            .json(input)
            .send()
            .await
            .map_err(|e| format!("Device registration failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(format!(
                "Device registration rejected ({}): {}",
                status, err_text
            ));
        }

        let envelope: ApiResponse<DeviceRecord> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse device response: {}", e))?;

        Ok(envelope.data)
    }

    /// Lists devices for current user.
    #[allow(dead_code)]
    pub async fn get_devices(&self, token: &str) -> Result<Vec<DeviceRecord>, String> {
        let url = format!("{}/devices", self.base_url);

        let resp = self
            .client
            .get(&url)
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| format!("Failed to retrieve devices: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Device list returned status: {}", resp.status()));
        }

        let envelope: ApiResponse<Vec<DeviceRecord>> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse devices list: {}", e))?;

        Ok(envelope.data)
    }

    /// Creates a new scan record.
    pub async fn create_scan(
        &self,
        token: &str,
        device_id: &str,
        scan_type: Option<&str>,
    ) -> Result<ScanRecord, String> {
        let url = format!("{}/scans", self.base_url);
        let input = CreateScanInput {
            device_id: device_id.to_string(),
            r#type: scan_type.unwrap_or("FULL").to_string(),
        };

        let resp = self
            .client
            .post(&url)
            .bearer_auth(token)
            .json(&input)
            .send()
            .await
            .map_err(|e| format!("Create scan failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(format!("Scan creation rejected ({}): {}", status, err_text));
        }

        let envelope: ApiResponse<ScanRecord> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse scan response: {}", e))?;

        Ok(envelope.data)
    }

    /// Synchronizes collected evidence with the backend and triggers Phase 5 engine evaluation.
    pub async fn sync_evidence(
        &self,
        token: &str,
        scan_id: &str,
        input: &SyncEvidenceInput,
    ) -> Result<ScanRecord, String> {
        let url = format!("{}/scans/{}/evidence", self.base_url, scan_id);

        let resp = self
            .client
            .post(&url)
            .bearer_auth(token)
            .json(input)
            .send()
            .await
            .map_err(|e| format!("Evidence sync request failed: {}", e))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let err_text = resp.text().await.unwrap_or_default();
            return Err(format!("Evidence sync rejected ({}): {}", status, err_text));
        }

        let envelope: ApiResponse<ScanRecord> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse sync response: {}", e))?;

        Ok(envelope.data)
    }

    /// Retrieves complete scan report.
    pub async fn get_scan_report(
        &self,
        token: &str,
        scan_id: &str,
    ) -> Result<serde_json::Value, String> {
        let url = format!("{}/scans/{}/report", self.base_url, scan_id);

        let resp = self
            .client
            .get(&url)
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| format!("Report request failed: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Report query returned status: {}", resp.status()));
        }

        let envelope: ApiResponse<serde_json::Value> = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse report response: {}", e))?;

        Ok(envelope.data)
    }
}
