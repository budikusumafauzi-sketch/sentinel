/**
 * Sentinel Desktop Agent — Web Client Interface
 * Light Theme & Privacy-Preserving Security Posture Dashboard
 */

const LOCAL_AGENT_URL = 'http://127.0.0.1:8765';
const BACKEND_URL = 'http://localhost:3000/api/v1';

let isAuthenticated = false;
let currentAuthUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  checkAuthStatus();
  checkAgentStatus();
  checkBackendHealth();

  // Poll backend health and agent status every 10 seconds
  setInterval(() => {
    checkAgentStatus();
    checkBackendHealth();
  }, 10000);
});

function initUI() {
  const btnScan = document.getElementById('btn-start-scan');
  if (btnScan) {
    btnScan.addEventListener('click', handleStartScan);
  }

  const btnAuthAction = document.getElementById('btn-auth-action');
  if (btnAuthAction) {
    btnAuthAction.addEventListener('click', () => {
      if (isAuthenticated) {
        handleLogout();
      } else {
        openLoginModal();
      }
    });
  }

  const btnBannerLogin = document.getElementById('btn-banner-login');
  if (btnBannerLogin) {
    btnBannerLogin.addEventListener('click', openLoginModal);
  }

  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeLoginModal);
  if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLoginModal);

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
}

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const err = document.getElementById('auth-error');
  if (err) err.style.display = 'none';
  if (modal) modal.style.display = 'flex';
  const emailInput = document.getElementById('input-email');
  if (emailInput) emailInput.focus();
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.style.display = 'none';
}

async function checkAuthStatus() {
  const dot = document.getElementById('auth-dot');
  const text = document.getElementById('auth-status-text');
  const banner = document.getElementById('auth-banner');
  const btnAuth = document.getElementById('btn-auth-action');

  try {
    const res = await fetch(`${LOCAL_AGENT_URL}/api/auth/status`);
    if (res.ok) {
      const data = await res.json();
      isAuthenticated = !!data.authenticated;
      currentAuthUser = data;

      if (isAuthenticated) {
        dot.className = 'status-dot online';
        text.textContent = data.email || 'Authenticated';
        if (banner) banner.style.display = 'none';
        if (btnAuth) {
          btnAuth.textContent = 'Sign Out';
          btnAuth.className = 'btn btn-secondary';
        }
      } else {
        dot.className = 'status-dot warning';
        text.textContent = 'Not Signed In';
        if (banner) banner.style.display = 'flex';
        if (btnAuth) {
          btnAuth.textContent = 'Sign In';
          btnAuth.className = 'btn btn-primary';
        }
      }
    }
  } catch (err) {
    console.warn('Unable to query auth status from local agent:', err);
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('input-email').value.trim();
  const password = document.getElementById('input-password').value;
  const btnSubmit = document.getElementById('btn-submit-login');
  const errDiv = document.getElementById('auth-error');

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Authenticating...';
  if (errDiv) errDiv.style.display = 'none';

  try {
    const res = await fetch(`${LOCAL_AGENT_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const body = await res.json();

    if (!res.ok) {
      throw new Error(body.error || 'Authentication rejected by server.');
    }

    closeLoginModal();
    await checkAuthStatus();
    await checkAgentStatus();
  } catch (err) {
    if (errDiv) {
      errDiv.textContent = err.message || 'Login failed.';
      errDiv.style.display = 'block';
    }
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Sign In';
  }
}

async function handleLogout() {
  try {
    await fetch(`${LOCAL_AGENT_URL}/api/auth/logout`, { method: 'POST' });
  } catch (err) {
    console.warn('Logout call failed:', err);
  }
  await checkAuthStatus();
  await checkAgentStatus();
}

async function checkAgentStatus() {
  try {
    const res = await fetch(`${LOCAL_AGENT_URL}/api/status`);
    if (res.ok) {
      const data = await res.json();
      updateIdentityCard(data);
      if (data.latestReport) {
        renderScanResults(data.latestReport);
      }
    }
  } catch (err) {
    console.warn('Local agent endpoint not responding on port 8765:', err);
  }
}

async function checkBackendHealth() {
  const dot = document.getElementById('backend-dot');
  const text = document.getElementById('backend-status-text');

  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    if (res.ok) {
      dot.className = 'status-dot online';
      text.textContent = 'Backend Connected';
    } else {
      dot.className = 'status-dot warning';
      text.textContent = 'Backend Degraded';
    }
  } catch {
    dot.className = 'status-dot offline';
    text.textContent = 'Backend Offline';
  }
}

function updateIdentityCard(data) {
  if (data.deviceInfo) {
    setText('ident-name', data.deviceInfo.model || 'Windows PC');
    setText('ident-os', data.deviceInfo.osVersion || 'Windows 11');
    setText('ident-build', data.deviceInfo.buildNumber || 'Unknown');
    setText('ident-arch', data.deviceInfo.architecture || 'x86_64');
  }
  if (data.deviceUuid) {
    setText('ident-uuid', data.deviceUuid);
  }
  if (data.backendDeviceId) {
    setText('ident-backend-id', data.backendDeviceId);
  }
}

async function handleStartScan() {
  const btnScan = document.getElementById('btn-start-scan');
  const progressContainer = document.getElementById('scan-progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');

  if (!isAuthenticated) {
    openLoginModal();
    return;
  }

  btnScan.disabled = true;
  progressContainer.style.display = 'block';
  progressFill.style.width = '15%';
  progressLabel.textContent = 'Collecting Windows system & security evidence...';

  try {
    progressFill.style.width = '40%';
    progressLabel.textContent = 'Inspecting Defender, Firewall, BitLocker, and UAC...';

    const res = await fetch(`${LOCAL_AGENT_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'FULL' }),
    });

    progressFill.style.width = '80%';
    progressLabel.textContent = 'Evaluating evidence with Phase 5 Security Engine...';

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `Scan failed with status: ${res.status}`);
    }

    const scanData = await res.json();
    progressFill.style.width = '100%';
    progressLabel.textContent = 'Inspection complete & synchronized!';

    setTimeout(() => {
      progressContainer.style.display = 'none';
      btnScan.disabled = false;
      renderScanResults(scanData);
      checkAgentStatus();
    }, 600);
  } catch (err) {
    console.error('Scan failed:', err);
    progressLabel.textContent = `Inspection error: ${err.message}`;
    btnScan.disabled = false;
  }
}

function renderScanResults(data) {
  const score = data.score ?? data.overallScore ?? (data.report && data.report.overallScore);
  const scoreBadge = document.getElementById('score-badge');
  const scoreVal = document.getElementById('score-value');
  const scoreDesc = document.getElementById('score-desc');
  const scoreDial = document.getElementById('score-dial');

  if (typeof score === 'number') {
    scoreVal.textContent = Math.round(score);
    if (score >= 80) {
      scoreBadge.textContent = 'Healthy';
      scoreBadge.className = 'score-status-badge secure';
      scoreDesc.textContent = 'Security posture is healthy across evaluated controls.';
      scoreDial.style.borderColor = 'var(--secure)';
    } else if (score >= 50) {
      scoreBadge.textContent = 'Attention Needed';
      scoreBadge.className = 'score-status-badge warning';
      scoreDesc.textContent = 'One or more security controls require review.';
      scoreDial.style.borderColor = 'var(--warning)';
    } else {
      scoreBadge.textContent = 'Action Required';
      scoreBadge.className = 'score-status-badge danger';
      scoreDesc.textContent = 'High priority security configurations disabled.';
      scoreDial.style.borderColor = 'var(--danger)';
    }
  } else {
    scoreVal.textContent = '--';
    scoreBadge.textContent = 'Insufficient Coverage';
    scoreBadge.className = 'score-status-badge';
  }

  // Counters
  const evaluated = data.evaluatedControls ?? (data.report && data.report.controlsEvaluated) ?? 0;
  const unavailable = data.unavailableChecks ?? (data.report && data.report.checksUnavailable) ?? 0;
  const findingsList = data.findings || (data.report && data.report.findings) || [];

  setText('stat-evaluated', evaluated);
  setText('stat-unavailable', unavailable);
  setText('stat-findings', findingsList.length);
  setText('findings-count', `${findingsList.length} Issues`);
  setText('last-inspected-time', new Date().toLocaleTimeString());

  // Render Findings
  const findingsContainer = document.getElementById('findings-container');
  findingsContainer.innerHTML = '';

  if (findingsList.length === 0) {
    findingsContainer.innerHTML = `
      <div class="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <h4>No Active Security Issues</h4>
        <p>Based on the checks available to Sentinel, no active security issues were detected across evaluated controls.</p>
      </div>
    `;
  } else {
    for (const f of findingsList) {
      const severityClass = (f.severity || 'medium').toLowerCase();
      const div = document.createElement('div');
      div.className = `finding-item ${severityClass}`;
      div.innerHTML = `
        <div class="finding-header">
          <span class="finding-title">${escapeHtml(f.title)}</span>
          <span class="severity-pill ${severityClass}">${escapeHtml(f.severity || 'MEDIUM')}</span>
        </div>
        <p class="finding-desc">${escapeHtml(f.description || '')}</p>
        ${f.recommendationText || f.remediation ? `<div class="finding-rec"><strong>Recommendation:</strong> ${escapeHtml(f.recommendationText || f.remediation)}</div>` : ''}
      `;
      findingsContainer.appendChild(div);
    }
  }

  // Render Controls Matrix
  const rawEvidence = data.rawEvidence || (data.inspection && data.inspection.rawEvidence) || [];
  const controlsGrid = document.getElementById('controls-grid');
  controlsGrid.innerHTML = '';

  for (const ev of rawEvidence) {
    const isVerified = ev.trustState === 'VERIFIED';
    const isPerm = ev.trustState === 'PERMISSION_REQUIRED';
    const isUnavail = ev.trustState === 'NOT_AVAILABLE';

    let badgeClass = 'verified';
    let badgeText = 'VERIFIED';
    if (isPerm) {
      badgeClass = 'permission';
      badgeText = 'PERM REQ';
    } else if (isUnavail) {
      badgeClass = 'unavailable';
      badgeText = 'NOT AVAIL';
    }

    let valStr = String(ev.value);
    if (typeof ev.value === 'boolean') {
      valStr = ev.value ? 'Active / Secure' : 'Disabled / Inactive';
    } else if (typeof ev.value === 'object' && ev.value !== null) {
      valStr = JSON.stringify(ev.value);
    }

    const item = document.createElement('div');
    item.className = 'control-item';
    item.innerHTML = `
      <div class="control-top">
        <span class="control-name">${escapeHtml(ev.checkName || ev.checkId)}</span>
        <span class="control-status-badge ${badgeClass}">${badgeText}</span>
      </div>
      <span class="control-value">${escapeHtml(valStr)}</span>
      <span class="control-provenance">${escapeHtml(ev.source || '')}</span>
    `;
    controlsGrid.appendChild(item);
  }

  // Update limitations list
  if (data.report && Array.isArray(data.report.errorsOrLimitations)) {
    const limitsList = document.getElementById('limits-list');
    if (data.report.errorsOrLimitations.length > 0) {
      limitsList.innerHTML = '';
      for (const lim of data.report.errorsOrLimitations) {
        const li = document.createElement('li');
        li.textContent = lim;
        limitsList.appendChild(li);
      }
    }
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
