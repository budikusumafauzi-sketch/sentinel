mod api;
mod identity;
mod inspection;
mod models;

use api::SentinelApiClient;
use identity::DeviceIdentityManager;
use inspection::run_full_inspection;
use models::{CreateDeviceInput, LoginPayload};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

const AGENT_PORT: u16 = 8765;
const DEFAULT_BACKEND_URL: &str = "http://localhost:3000/api/v1";

#[derive(Clone)]
struct AppState {
    identity_manager: Arc<DeviceIdentityManager>,
    api_client: Arc<SentinelApiClient>,
    latest_report: Arc<Mutex<Option<serde_json::Value>>>,
    cached_auth_token: Arc<Mutex<Option<String>>>,
    cached_user_email: Arc<Mutex<Option<String>>>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("============================================================");
    println!("  SENTINEL — Personal Cybersecurity Intelligence");
    println!("  Windows Desktop Security Agent v0.1.0 (Phase 6)");
    println!("============================================================");

    let identity_mgr = Arc::new(DeviceIdentityManager::new());
    let initial_identity = identity_mgr.get_or_create_identity(None);
    println!("[*] Device UUID: {}", initial_identity.device_uuid);
    println!("[*] Device Name: {}", initial_identity.device_name);
    if let Some(ref bid) = initial_identity.backend_device_id {
        println!("[*] Registered Backend Device ID: {}", bid);
    } else {
        println!("[*] Device not yet registered with backend");
    }

    let backend_url =
        std::env::var("SENTINEL_BACKEND_URL").unwrap_or_else(|_| DEFAULT_BACKEND_URL.to_string());
    println!("[*] Sentinel Backend URL: {}", backend_url);

    let api_client = Arc::new(SentinelApiClient::new(Some(&backend_url)));

    let state = AppState {
        identity_manager: identity_mgr,
        api_client,
        latest_report: Arc::new(Mutex::new(None)),
        cached_auth_token: Arc::new(Mutex::new(None)),
        cached_user_email: Arc::new(Mutex::new(None)),
    };

    // Check CLI argument overrides for authentication
    let args: Vec<String> = std::env::args().collect();
    for i in 1..args.len() {
        if args[i] == "--token" && i + 1 < args.len() {
            let cli_token = args[i + 1].trim().to_string();
            if let Ok(mut lock) = state.cached_auth_token.lock() {
                *lock = Some(cli_token);
            }
        } else if args[i] == "--email" && i + 1 < args.len() {
            let cli_email = args[i + 1].trim().to_string();
            let cli_pass = if i + 3 < args.len() && args[i + 2] == "--password" {
                args[i + 3].trim().to_string()
            } else {
                std::env::var("SENTINEL_PASSWORD").unwrap_or_default()
            };
            if !cli_pass.is_empty() {
                if let Ok(auth) = state.api_client.login(&cli_email, &cli_pass).await {
                    let session = crate::models::AuthSession {
                        access_token: auth.access_token.clone(),
                        user_id: auth.user.id.clone(),
                        email: auth.user.email.clone(),
                        saved_at: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = state.identity_manager.save_session(&session);
                    if let Ok(mut lock) = state.cached_auth_token.lock() {
                        *lock = Some(auth.access_token);
                    }
                    if let Ok(mut email_lock) = state.cached_user_email.lock() {
                        *email_lock = Some(auth.user.email);
                    }
                }
            }
        }
    }

    if args.iter().any(|arg| arg == "--scan" || arg == "--cli") {
        println!("[*] Running in headless inspection mode (--scan)...");
        let result = execute_scan_and_sync(&state).await?;
        println!("\n=== SCAN EXECUTION SUMMARY ===");
        println!("{}", serde_json::to_string_pretty(&result)?);
        return Ok(());
    }

    // Start local loopback-only server for UI and IPC
    let server_addr: SocketAddr = format!("127.0.0.1:{}", AGENT_PORT).parse()?;
    println!(
        "[*] Starting local desktop agent server on http://{}",
        server_addr
    );

    let listener = TcpListener::bind(server_addr).await?;
    println!("[+] Local Desktop Agent UI ready at http://{}", server_addr);

    // Launch desktop window if requested or in default mode
    if !args.iter().any(|arg| arg == "--no-ui") {
        launch_desktop_window(AGENT_PORT);
    }

    // Run server loop
    let state_clone = state.clone();
    tokio::spawn(async move {
        loop {
            if let Ok((socket, _)) = listener.accept().await {
                let state_inner = state_clone.clone();
                tokio::spawn(async move {
                    handle_http_connection(socket, state_inner).await;
                });
            }
        }
    });

    println!("[*] Sentinel Desktop Agent running. Press Ctrl+C to terminate.");
    tokio::signal::ctrl_c().await?;
    println!("\n[*] Shutting down Sentinel Desktop Agent cleanly.");
    Ok(())
}

/// Executes full Windows inspection, authenticates, registers device if needed, and synchronizes evidence.
async fn execute_scan_and_sync(state: &AppState) -> Result<serde_json::Value, String> {
    println!("[1/4] Running authoritative Windows system & security inspection...");
    let (inspection_result, sync_input) = run_full_inspection();
    println!(
        "      -> {} checks executed, {} applications discovered",
        sync_input.raw_evidence.len(),
        inspection_result.application_discovery.total_discovered
    );

    // Obtain authenticated token safely without hardcoded credentials
    println!("[2/4] Authenticating with Sentinel backend...");
    let token = resolve_auth_token(state).await?;

    // Ensure device is registered in backend
    println!("[3/4] Ensuring device registration in Sentinel backend...");
    let identity = state.identity_manager.get_or_create_identity(None);
    let mut backend_device_id = identity.backend_device_id.clone();
    if backend_device_id.is_none() {
        let reg_input = CreateDeviceInput {
            name: identity.device_name.clone(),
            platform: "WINDOWS".to_string(),
            os_version: Some(inspection_result.device_info.os_version.clone()),
            model: Some(inspection_result.device_info.model.clone()),
            manufacturer: Some(inspection_result.device_info.manufacturer.clone()),
        };
        let dev_rec = state.api_client.register_device(&token, &reg_input).await?;
        println!("      -> New device registered with ID: {}", dev_rec.id);
        let _ = state.identity_manager.update_backend_device_id(&dev_rec.id);
        backend_device_id = Some(dev_rec.id);
    } else if let Some(ref existing_id) = backend_device_id {
        println!("      -> Reusing registered device ID: {}", existing_id);
    }

    let active_device_id = backend_device_id.as_deref().unwrap_or_default();

    // Create scan and sync evidence
    println!("[4/4] Creating scan and synchronizing evidence with Phase 5 Security Engine...");
    let scan_record = match state
        .api_client
        .create_scan(&token, active_device_id, Some("FULL"))
        .await
    {
        Ok(rec) => rec,
        Err(err) if err.contains("404") || err.contains("Device not found") => {
            println!("      -> Device record not found in backend; re-registering device...");
            let reg_input = CreateDeviceInput {
                name: identity.device_name.clone(),
                platform: "WINDOWS".to_string(),
                os_version: Some(inspection_result.device_info.os_version.clone()),
                model: Some(inspection_result.device_info.model.clone()),
                manufacturer: Some(inspection_result.device_info.manufacturer.clone()),
            };
            let dev_rec = state.api_client.register_device(&token, &reg_input).await?;
            println!("      -> Re-registered device with ID: {}", dev_rec.id);
            let _ = state.identity_manager.update_backend_device_id(&dev_rec.id);
            state
                .api_client
                .create_scan(&token, &dev_rec.id, Some("FULL"))
                .await?
        }
        Err(e) => return Err(e),
    };

    let sync_result = state
        .api_client
        .sync_evidence(&token, &scan_record.id, &sync_input)
        .await?;

    // Retrieve evaluated scan report
    let report_val = match state
        .api_client
        .get_scan_report(&token, &scan_record.id)
        .await
    {
        Ok(rep) => rep,
        Err(_) => serde_json::json!(sync_result),
    };

    let complete_payload = serde_json::json!({
        "scanId": scan_record.id,
        "deviceId": backend_device_id,
        "score": sync_result.score,
        "status": sync_result.status,
        "summary": sync_result.summary,
        "report": report_val,
        "inspection": inspection_result,
        "rawEvidence": sync_input.raw_evidence,
        "completedAt": chrono::Utc::now().to_rfc3339()
    });

    if let Ok(mut lock) = state.latest_report.lock() {
        *lock = Some(complete_payload.clone());
    }

    Ok(complete_payload)
}

/// Resolves authentication token securely:
/// 1. Cached in-memory token
/// 2. SENTINEL_AUTH_TOKEN environment variable
/// 3. Persisted session in %APPDATA%\Sentinel\session.json (verified against backend)
/// 4. SENTINEL_EMAIL / SENTINEL_PASSWORD environment variables (if provided)
/// 5. Never uses hardcoded credentials!
async fn resolve_auth_token(state: &AppState) -> Result<String, String> {
    // 1. Cached in-memory token
    if let Ok(lock) = state.cached_auth_token.lock() {
        if let Some(ref t) = *lock {
            return Ok(t.clone());
        }
    }

    // 2. SENTINEL_AUTH_TOKEN environment variable
    if let Ok(env_token) = std::env::var("SENTINEL_AUTH_TOKEN") {
        let clean = env_token.trim().to_string();
        if !clean.is_empty() {
            if let Ok(user) = state.api_client.get_current_user(&clean).await {
                if let Ok(mut lock) = state.cached_auth_token.lock() {
                    *lock = Some(clean.clone());
                }
                if let Ok(mut email_lock) = state.cached_user_email.lock() {
                    *email_lock = Some(user.email);
                }
                return Ok(clean);
            }
        }
    }

    // 3. Persisted session
    if let Ok(session) = state.identity_manager.load_session() {
        if let Ok(user) = state
            .api_client
            .get_current_user(&session.access_token)
            .await
        {
            if let Ok(mut lock) = state.cached_auth_token.lock() {
                *lock = Some(session.access_token.clone());
            }
            if let Ok(mut email_lock) = state.cached_user_email.lock() {
                *email_lock = Some(user.email);
            }
            return Ok(session.access_token);
        } else {
            // Expired or invalid session
            state.identity_manager.clear_session();
        }
    }

    // 4. SENTINEL_EMAIL / SENTINEL_PASSWORD env vars
    if let (Ok(email), Ok(password)) = (
        std::env::var("SENTINEL_EMAIL"),
        std::env::var("SENTINEL_PASSWORD"),
    ) {
        let clean_email = email.trim().to_string();
        let clean_pass = password.trim().to_string();
        if !clean_email.is_empty() && !clean_pass.is_empty() {
            match state.api_client.login(&clean_email, &clean_pass).await {
                Ok(auth) => {
                    let session = crate::models::AuthSession {
                        access_token: auth.access_token.clone(),
                        user_id: auth.user.id.clone(),
                        email: auth.user.email.clone(),
                        saved_at: chrono::Utc::now().to_rfc3339(),
                    };
                    let _ = state.identity_manager.save_session(&session);
                    if let Ok(mut lock) = state.cached_auth_token.lock() {
                        *lock = Some(auth.access_token.clone());
                    }
                    if let Ok(mut email_lock) = state.cached_user_email.lock() {
                        *email_lock = Some(auth.user.email);
                    }
                    return Ok(auth.access_token);
                }
                Err(err) => return Err(format!("Login failed for env credentials: {}", err)),
            }
        }
    }

    Err("Authentication required. Set SENTINEL_AUTH_TOKEN, provide SENTINEL_EMAIL & SENTINEL_PASSWORD, or authenticate via the desktop UI.".to_string())
}

/// Handles incoming HTTP requests for static UI files and local REST IPC endpoints.
async fn handle_http_connection(mut socket: tokio::net::TcpStream, state: AppState) {
    let mut buffer = [0u8; 8192];
    let bytes_read = match socket.read(&mut buffer).await {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let request_str = String::from_utf8_lossy(&buffer[..bytes_read]);
    let first_line = request_str.lines().next().unwrap_or_default();
    let parts: Vec<&str> = first_line.split_whitespace().collect();

    if parts.len() < 2 {
        return;
    }

    let method = parts[0];
    let path = parts[1];

    // Local loopback CORS enforcement (strictly no wildcard *)
    let allowed_origin = "http://127.0.0.1:8765";
    let cors_headers = format!(
        "Access-Control-Allow-Origin: {}\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type, Authorization\r\n",
        allowed_origin
    );

    if method == "OPTIONS" {
        send_http_response(
            &mut socket,
            "204 No Content",
            "text/plain",
            &cors_headers,
            b"",
        )
        .await;
        return;
    }

    // 1. GET /api/status
    if path == "/api/status" && method == "GET" {
        let identity = state.identity_manager.get_or_create_identity(None);
        let (device_info, _) = inspection::os::inspect_os();
        let latest_report = state.latest_report.lock().ok().and_then(|l| l.clone());
        let is_authed = resolve_auth_token(&state).await.is_ok();
        let auth_email = state.cached_user_email.lock().ok().and_then(|e| e.clone());

        let status_json = serde_json::json!({
            "deviceUuid": identity.device_uuid,
            "deviceName": identity.device_name,
            "backendDeviceId": identity.backend_device_id,
            "deviceInfo": device_info,
            "latestReport": latest_report,
            "agentVersion": "0.1.0",
            "platform": "WINDOWS",
            "authenticated": is_authed,
            "userEmail": auth_email
        });

        let body = status_json.to_string();
        send_http_response(
            &mut socket,
            "200 OK",
            "application/json",
            &cors_headers,
            body.as_bytes(),
        )
        .await;
        return;
    }

    // 2. GET /api/auth/status
    if path == "/api/auth/status" && method == "GET" {
        let is_authed = resolve_auth_token(&state).await.is_ok();
        let email = state.cached_user_email.lock().ok().and_then(|e| e.clone());
        let resp_json = serde_json::json!({
            "authenticated": is_authed,
            "email": email
        });
        let body = resp_json.to_string();
        send_http_response(
            &mut socket,
            "200 OK",
            "application/json",
            &cors_headers,
            body.as_bytes(),
        )
        .await;
        return;
    }

    // 3. POST /api/auth/login
    if path == "/api/auth/login" && method == "POST" {
        let body_str = extract_http_body(&request_str);
        match serde_json::from_str::<LoginPayload>(body_str) {
            Ok(payload) => {
                match state
                    .api_client
                    .login(&payload.email, &payload.password)
                    .await
                {
                    Ok(auth) => {
                        let session = crate::models::AuthSession {
                            access_token: auth.access_token.clone(),
                            user_id: auth.user.id.clone(),
                            email: auth.user.email.clone(),
                            saved_at: chrono::Utc::now().to_rfc3339(),
                        };
                        let _ = state.identity_manager.save_session(&session);
                        if let Ok(mut lock) = state.cached_auth_token.lock() {
                            *lock = Some(auth.access_token);
                        }
                        if let Ok(mut email_lock) = state.cached_user_email.lock() {
                            *email_lock = Some(auth.user.email.clone());
                        }

                        let resp_json = serde_json::json!({
                            "success": true,
                            "user": {
                                "id": auth.user.id,
                                "email": auth.user.email,
                                "name": auth.user.name
                            }
                        });
                        let body = resp_json.to_string();
                        send_http_response(
                            &mut socket,
                            "200 OK",
                            "application/json",
                            &cors_headers,
                            body.as_bytes(),
                        )
                        .await;
                    }
                    Err(err) => {
                        let err_json =
                            serde_json::json!({ "error": format!("Login failed: {}", err) });
                        let body = err_json.to_string();
                        send_http_response(
                            &mut socket,
                            "401 Unauthorized",
                            "application/json",
                            &cors_headers,
                            body.as_bytes(),
                        )
                        .await;
                    }
                }
            }
            Err(_) => {
                let err_json = serde_json::json!({ "error": "Invalid request payload" });
                let body = err_json.to_string();
                send_http_response(
                    &mut socket,
                    "400 Bad Request",
                    "application/json",
                    &cors_headers,
                    body.as_bytes(),
                )
                .await;
            }
        }
        return;
    }

    // 4. POST /api/auth/logout
    if path == "/api/auth/logout" && method == "POST" {
        if let Ok(mut lock) = state.cached_auth_token.lock() {
            *lock = None;
        }
        if let Ok(mut email_lock) = state.cached_user_email.lock() {
            *email_lock = None;
        }
        state.identity_manager.clear_session();

        let resp_json = serde_json::json!({ "success": true });
        let body = resp_json.to_string();
        send_http_response(
            &mut socket,
            "200 OK",
            "application/json",
            &cors_headers,
            body.as_bytes(),
        )
        .await;
        return;
    }

    // 5. POST /api/scan
    if path == "/api/scan" && method == "POST" {
        match execute_scan_and_sync(&state).await {
            Ok(result) => {
                let body = result.to_string();
                send_http_response(
                    &mut socket,
                    "200 OK",
                    "application/json",
                    &cors_headers,
                    body.as_bytes(),
                )
                .await;
            }
            Err(err) => {
                let err_json = serde_json::json!({ "error": err });
                let body = err_json.to_string();
                send_http_response(
                    &mut socket,
                    "500 Internal Server Error",
                    "application/json",
                    &cors_headers,
                    body.as_bytes(),
                )
                .await;
            }
        }
        return;
    }

    // Serve static files from apps/desktop/ui
    let (content_type, body_bytes): (&str, Vec<u8>) = match path {
        "/" | "/index.html" => (
            "text/html; charset=utf-8",
            include_bytes!("../ui/index.html").to_vec(),
        ),
        "/style.css" => (
            "text/css; charset=utf-8",
            include_bytes!("../ui/style.css").to_vec(),
        ),
        "/app.js" => (
            "application/javascript; charset=utf-8",
            include_bytes!("../ui/app.js").to_vec(),
        ),
        _ => {
            send_http_response(
                &mut socket,
                "404 Not Found",
                "text/plain",
                &cors_headers,
                b"404 Not Found",
            )
            .await;
            return;
        }
    };

    send_http_response(
        &mut socket,
        "200 OK",
        content_type,
        &cors_headers,
        &body_bytes,
    )
    .await;
}

async fn send_http_response(
    socket: &mut tokio::net::TcpStream,
    status: &str,
    content_type: &str,
    cors_headers: &str,
    body: &[u8],
) {
    let header = format!(
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n{}\r\n",
        status,
        content_type,
        body.len(),
        cors_headers
    );
    let _ = socket.write_all(header.as_bytes()).await;
    let _ = socket.write_all(body).await;
    let _ = socket.flush().await;
    let _ = socket.shutdown().await;
}

fn extract_http_body(request: &str) -> &str {
    if let Some(pos) = request.find("\r\n\r\n") {
        &request[pos + 4..]
    } else if let Some(pos) = request.find("\n\n") {
        &request[pos + 2..]
    } else {
        ""
    }
}

/// Opens the local web UI in an application-mode native desktop window using Windows Edge WebView2.
fn launch_desktop_window(port: u16) {
    let url = format!("http://127.0.0.1:{}", port);
    println!(
        "[*] Launching native desktop application window for {}...",
        url
    );

    // Try msedge in app mode first (creates a frameless, standalone desktop window)
    let edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ];

    for edge_path in edge_paths {
        if std::path::Path::new(edge_path).exists() {
            let app_arg = format!("--app={}", url);
            let window_arg = "--window-size=1280,860";
            if std::process::Command::new(edge_path)
                .args([&app_arg, window_arg])
                .spawn()
                .is_ok()
            {
                return;
            }
        }
    }

    // Fallback: system default browser
    let _ = std::process::Command::new("cmd")
        .args(["/c", "start", &url])
        .spawn();
}
