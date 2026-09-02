/**
 * Sentinel Security Domain Types (Phase 2 UI Foundation)
 */

import type { SeverityLevel, StatusType } from './ui';

export interface SecurityScore {
  score: number;
  status: 'SECURE' | 'ATTENTION' | 'CRITICAL';
  statusLabel: string;
  pointsDelta: number;
  deltaLabel: string;
  checksCompleted: number;
  lastScanTime: string;
  headline: string;
}

export interface FindingSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface SecurityCategory {
  id: 'device' | 'applications' | 'accounts' | 'privacy' | 'network' | 'system';
  name: string;
  score: number;
  status: StatusType;
  statusLabel: string;
  checksCount: number;
  issuesCount: number;
  icon: string;
  description: string;
}

export interface SystemControlStatus {
  id: string;
  name: string;
  status: StatusType;
  statusLabel: string;
  lastChecked: string;
}

export interface Recommendation {
  id: string;
  priority: SeverityLevel;
  priorityLabel: string;
  title: string;
  description: string;
  impact: string;
  estimatedTime: string;
  category: string;
  actionLabel: string;
}

export interface ActivityItem {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'scan' | 'app' | 'settings' | 'network' | 'alert';
  severity?: SeverityLevel;
}

export interface ApplicationSecurityItem {
  id: string;
  name: string;
  iconName: string;
  status: StatusType;
  statusLabel: string;
  description: string;
  permissionsCount?: number;
  riskNote?: string;
  isSystem?: boolean;
}

export interface Finding {
  id: string;
  title: string;
  category: string;
  severity: SeverityLevel;
  description: string;
  whyItMatters: string;
  detectedDetail: string;
  confidence: number;
  recommendation: string;
  evidence: Array<{ label: string; value: string }>;
  status: 'active' | 'resolved' | 'ignored';
}

export interface ScanStage {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'unavailable' | 'failed';
  detail?: string;
}

export interface ScanProgress {
  progress: number;
  currentStage: string;
  stages: ScanStage[];
  checksCompleted: number;
  totalChecks: number;
  isScanning: boolean;
}

export interface SecurityReport {
  scanId: string;
  timestamp: string;
  duration: string;
  checksAttempted: number;
  checksCompleted: number;
  checksPassed: number;
  checksAttention: number;
  checksCritical: number;
  categories: Array<{
    id: string;
    name: string;
    score: number;
    totalChecks: number;
    passedChecks: number;
    attentionChecks: number;
  }>;
  findings: Finding[];
  limitations: string[];
}

export interface ThreatAnalyzerResult {
  id: string;
  type: 'message' | 'url' | 'screenshot';
  inputSummary: string;
  riskLevel: SeverityLevel;
  confidence: number;
  threatType: string;
  summary: string;
  indicators: string[];
  recommendations: string[];
  evidenceList: Array<{ label: string; value: string }>;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  platform: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux';
  model: string;
  score: number;
  lastSeen: string;
  isCurrentDevice: boolean;
}
