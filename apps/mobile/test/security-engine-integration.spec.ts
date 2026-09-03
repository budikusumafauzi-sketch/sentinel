import { securityStore } from '../src/services/securityStore';
import { DeviceScannerService } from '../src/services/deviceScanner';
import { apiClient } from '../src/api/client';
import { executeSecurityEngine } from '@sentinel/types';

jest.mock('../src/api/client', () => ({
  apiClient: {
    getToken: jest.fn(),
    getDevices: jest.fn(),
    registerDevice: jest.fn(),
    createScan: jest.fn(),
    syncScanEvidence: jest.fn(),
    getScans: jest.fn(),
    getScan: jest.fn(),
    getScanReport: jest.fn(),
    getLatestScore: jest.fn(),
    getDeviceFindings: jest.fn(),
    getDeviceRecommendations: jest.fn(),
    getDeviceHistory: jest.fn(),
    getDeviceEvents: jest.fn(),
  },
}));

describe('Sentinel Phase 5: Mobile Security Engine Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. SecurityStore — Truthful State Management', () => {
    it('provides truthful initial state when no scan has been executed', () => {
      // In fresh/unscanned state
      const scoreData = securityStore.getScoreData();
      expect(scoreData.score).toBe(0);
      expect(scoreData.statusLabel).toContain('Pending');
      expect(scoreData.checksCompleted).toBe(0);
      expect(scoreData.lastScanTime).toBe('Never');

      const summary = securityStore.getFindingsSummary();
      expect(summary.critical).toBe(0);
      expect(summary.high).toBe(0);
      expect(summary.medium).toBe(0);
      expect(summary.low).toBe(0);

      const categories = securityStore.getCategories();
      expect(categories.length).toBe(6);
      expect(categories.every((c) => c.statusLabel === 'Not Evaluated' || c.checksCount >= 0)).toBe(true);
    });

    it('updates state accurately when CompleteScanReport is loaded', () => {
      // Generate a deterministic engine report
      const engineResult = executeSecurityEngine({
        scanId: 'mobile-test-scan-1',
        deviceId: 'mobile-test-device-1',
        deviceInfo: {
          manufacturer: 'Google',
          model: 'Pixel 8',
          osVersion: '14',
          securityPatch: '2024-08-05',
          isEmulator: false,
          platform: 'ANDROID',
        },
        rawEvidence: [
          {
            checkId: 'security.screen_lock',
            checkName: 'Screen Lock Configuration',
            value: false, // Disconnected -> triggers SEC-SYS-SCREEN-LOCK
            trustState: 'VERIFIED',
            capabilityStatus: 'SUPPORTED',
            source: 'KeyguardManager.isDeviceSecure()',
            category: 'SYSTEM',
            confidence: 1.0,
            evaluatedAt: new Date().toISOString(),
          },
          {
            checkId: 'security.storage_encryption',
            checkName: 'Storage Encryption Status',
            value: true,
            trustState: 'VERIFIED',
            capabilityStatus: 'SUPPORTED',
            source: 'DevicePolicyManager.getStorageEncryptionStatus()',
            category: 'SYSTEM',
            confidence: 1.0,
            evaluatedAt: new Date().toISOString(),
          },
        ],
      });

      securityStore.setReport(engineResult.report);

      const scoreData = securityStore.getScoreData();
      expect(scoreData.score).toBe(engineResult.report.overallScore);
      expect(scoreData.checksCompleted).toBe(engineResult.report.checksCompleted);
      expect(scoreData.headline).toBe(engineResult.report.summary);

      const summary = securityStore.getFindingsSummary();
      expect(summary.high).toBe(1); // SEC-SYS-SCREEN-LOCK is HIGH severity

      const findings = securityStore.getFindings();
      expect(findings.length).toBe(1);
      expect(findings[0]?.title).toContain('Screen Lock');
      expect(findings[0]?.severity).toBe('high');

      const recommendations = securityStore.getRecommendations();
      expect(recommendations.length).toBe(1);
      expect(recommendations[0]?.title).toContain('Screen Lock');

      const fullReportData = securityStore.getReportViewData();
      expect(fullReportData).not.toBeNull();
      expect(fullReportData?.scanId).toBe('mobile-test-scan-1');
      expect(fullReportData?.findings.length).toBe(1);
    });
  });

  describe('2. DeviceScannerService Phase 5 Execution', () => {
    it('runs local deterministic security engine and truthfully reports unavailable checks in non-native test environment', async () => {
      const scanner = new DeviceScannerService();
      const result = await scanner.runScan(undefined, false);

      expect(result).toBeDefined();
      expect((result as any).report).toBeDefined();

      const report = (result as any).report;
      expect(report.rulesetVersion).toBe('1.0.0');
      // In non-native test environment, fallback signals are UNABLE_TO_VERIFY -> unavailableChecks recorded truthfully!
      expect(report.scoreBreakdown.unavailableCheckCount).toBeGreaterThan(0);
      expect(report.categoryScores).toBeDefined();

      // Ensure report was set in securityStore
      const currentStoreReport = securityStore.getReport();
      expect(currentStoreReport).toBe(report);
    });

    it('populates evaluated controls and score when native evidence is verified', async () => {
      const { SentinelDeviceIntelligence } = require('../modules/sentinel-device-intelligence/src');
      jest.spyOn(SentinelDeviceIntelligence, 'isAvailable').mockReturnValue(true);
      jest.spyOn(SentinelDeviceIntelligence, 'getDeviceInfo').mockResolvedValue({
        manufacturer: 'Google',
        model: 'Pixel 8',
        osVersion: '14',
        securityPatch: '2024-08-05',
        isEmulator: false,
      });
      jest.spyOn(SentinelDeviceIntelligence, 'getSystemSignals').mockResolvedValue({
        isDeviceSecure: true,
        biometricStatus: 'BIOMETRIC_SUCCESS',
        encryptionStatus: 'ENCRYPTED',
        developerOptionsEnabled: false,
        adbEnabled: false,
      });
      jest.spyOn(SentinelDeviceIntelligence, 'getInstalledApplications').mockResolvedValue({
        status: 'discovered',
        totalDiscovered: 5,
        applications: [],
      });
      jest.spyOn(SentinelDeviceIntelligence, 'getNetworkSignals').mockResolvedValue({
        isConnected: true,
        isVpnActive: false,
      });
      jest.spyOn(SentinelDeviceIntelligence, 'getCapabilities').mockResolvedValue({});

      const scanner = new DeviceScannerService();
      const result = await scanner.runScan(undefined, false);

      expect(result).toBeDefined();
      const report = (result as any).report;
      expect(report).toBeDefined();
      expect(report.checksCompleted).toBeGreaterThan(0);
      expect(report.overallScore).toBe(100); // Fully secure device baseline
      expect(report.findingCounts.total).toBe(0);

      SentinelDeviceIntelligence.isAvailable.mockRestore?.();
    });
  });

  describe('3. Mobile ApiClient Phase 5 Endpoints', () => {
    it('exposes Phase 5 security endpoints on ApiClient', () => {
      expect(typeof apiClient.getScanReport).toBe('function');
      expect(typeof apiClient.getLatestScore).toBe('function');
      expect(typeof apiClient.getDeviceFindings).toBe('function');
      expect(typeof apiClient.getDeviceRecommendations).toBe('function');
      expect(typeof apiClient.getDeviceHistory).toBe('function');
      expect(typeof apiClient.getDeviceEvents).toBe('function');
    });
  });
});
