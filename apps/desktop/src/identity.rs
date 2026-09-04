use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{create_dir_all, File};
use std::io::{Read, Write};
use std::path::PathBuf;
use uuid::Uuid;
use winreg::enums::HKEY_LOCAL_MACHINE;
use winreg::RegKey;

const IDENTITY_SALT: &str = "sentinel:windows:device-identity:v1:";

/// Persistent local state for the Windows Sentinel agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalDeviceState {
    pub device_uuid: String,
    pub device_name: String,
    pub backend_device_id: Option<String>,
    pub created_at: String,
}

/// Retrieves or initializes stable, privacy-conscious Windows device identity and authenticated session.
pub struct DeviceIdentityManager {
    state_path: PathBuf,
    session_path: PathBuf,
}

impl DeviceIdentityManager {
    pub fn new() -> Self {
        let appdata = std::env::var("APPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(r"C:\ProgramData"));
        let dir = appdata.join("Sentinel");
        let _ = create_dir_all(&dir);
        let state_path = dir.join("device_state.json");
        let session_path = dir.join("session.json");
        Self {
            state_path,
            session_path,
        }
    }

    #[cfg(test)]
    pub fn with_path(state_path: PathBuf) -> Self {
        let session_path = state_path.with_file_name("test_session.json");
        Self {
            state_path,
            session_path,
        }
    }

    /// Loads persisted authenticated session if available.
    pub fn load_session(&self) -> Result<crate::models::AuthSession, String> {
        let mut file = File::open(&self.session_path).map_err(|e| e.to_string())?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    }

    /// Persists authenticated session token and user info.
    /// Security guarantee: Passwords are NEVER persisted.
    pub fn save_session(&self, session: &crate::models::AuthSession) -> Result<(), String> {
        if let Some(parent) = self.session_path.parent() {
            let _ = create_dir_all(parent);
        }
        let json = serde_json::to_string_pretty(session).map_err(|e| e.to_string())?;
        let mut file = File::create(&self.session_path).map_err(|e| e.to_string())?;
        file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Clears expired or invalidated authenticated session.
    pub fn clear_session(&self) {
        let _ = std::fs::remove_file(&self.session_path);
    }

    /// Loads existing device state or creates and persists a new one.
    pub fn get_or_create_identity(&self, preferred_name: Option<&str>) -> LocalDeviceState {
        if let Ok(state) = self.load_state() {
            return state;
        }

        let device_uuid = self.generate_stable_uuid();
        let computer_name =
            std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Windows-PC".to_string());
        let device_name = preferred_name
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("Windows PC ({})", computer_name));

        let state = LocalDeviceState {
            device_uuid,
            device_name,
            backend_device_id: None,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        let _ = self.save_state(&state);
        state
    }

    /// Associates the registered backend device ID with local state.
    pub fn update_backend_device_id(&self, backend_id: &str) -> Result<LocalDeviceState, String> {
        let mut state = self.get_or_create_identity(None);
        state.backend_device_id = Some(backend_id.to_string());
        self.save_state(&state)?;
        Ok(state)
    }

    fn load_state(&self) -> Result<LocalDeviceState, String> {
        let mut file = File::open(&self.state_path).map_err(|e| e.to_string())?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)
            .map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    }

    fn save_state(&self, state: &LocalDeviceState) -> Result<(), String> {
        if let Some(parent) = self.state_path.parent() {
            let _ = create_dir_all(parent);
        }
        let json = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
        let mut file = File::create(&self.state_path).map_err(|e| e.to_string())?;
        file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// Generates a stable UUID derived from a hashed MachineGuid.
    /// Privacy guarantee: The raw MachineGuid is NEVER stored or sent over the network.
    fn generate_stable_uuid(&self) -> String {
        let raw_guid = Self::read_machine_guid().unwrap_or_else(|| Uuid::new_v4().to_string());
        let mut hasher = Sha256::new();
        hasher.update(IDENTITY_SALT.as_bytes());
        hasher.update(raw_guid.as_bytes());
        let hash = hasher.finalize();

        // Use first 16 bytes of hash to construct a deterministic UUID v5/custom format
        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&hash[0..16]);
        // Set UUID version 4/5 bits
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        Uuid::from_bytes(bytes).to_string()
    }

    fn read_machine_guid() -> Option<String> {
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let crypto_key = hklm.open_subkey(r"SOFTWARE\Microsoft\Cryptography").ok()?;
        crypto_key.get_value("MachineGuid").ok()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identity_persistence_and_reuse() {
        let temp_dir = std::env::temp_dir().join(format!("sentinel_test_{}", Uuid::new_v4()));
        let _ = create_dir_all(&temp_dir);
        let state_path = temp_dir.join("test_identity.json");

        let manager = DeviceIdentityManager::with_path(state_path.clone());

        // First creation
        let state1 = manager.get_or_create_identity(Some("Test Workstation"));
        assert!(!state1.device_uuid.is_empty());
        assert_eq!(state1.device_name, "Test Workstation");
        assert!(state1.backend_device_id.is_none());

        // Update backend device ID
        let updated = manager.update_backend_device_id("dev-backend-123").unwrap();
        assert_eq!(
            updated.backend_device_id.as_deref(),
            Some("dev-backend-123")
        );

        // Second load from disk — must preserve UUID and backend device ID!
        let manager2 = DeviceIdentityManager::with_path(state_path.clone());
        let state2 = manager2.get_or_create_identity(None);
        assert_eq!(state1.device_uuid, state2.device_uuid);
        assert_eq!(state2.backend_device_id.as_deref(), Some("dev-backend-123"));

        let _ = std::fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_session_persistence_and_clearing() {
        let temp_dir =
            std::env::temp_dir().join(format!("sentinel_session_test_{}", Uuid::new_v4()));
        let _ = create_dir_all(&temp_dir);
        let state_path = temp_dir.join("test_identity.json");
        let manager = DeviceIdentityManager::with_path(state_path);

        assert!(manager.load_session().is_err());

        let session = crate::models::AuthSession {
            access_token: "jwt-test-token-xyz".to_string(),
            user_id: "user-uuid-1".to_string(),
            email: "user@example.com".to_string(),
            saved_at: "2026-09-04T00:00:00Z".to_string(),
        };

        manager.save_session(&session).unwrap();

        let loaded = manager.load_session().unwrap();
        assert_eq!(loaded.access_token, "jwt-test-token-xyz");
        assert_eq!(loaded.email, "user@example.com");

        manager.clear_session();
        assert!(manager.load_session().is_err());

        let _ = std::fs::remove_dir_all(temp_dir);
    }
}
