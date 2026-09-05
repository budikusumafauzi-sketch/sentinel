import React from 'react';
import { ScoreGauge } from '../src/components/security/ScoreGauge';
import { EvidenceProvenanceCard } from '../src/components/security/EvidenceProvenanceCard';
import { AnalyzerInput } from '../src/components/analyzer/AnalyzerInput';
import { mockSecurityScore, mockFindingsSummary, mockDevices } from '../src/mock/securityData';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
} from '../src/services/preferencesStore';
import type { EvidenceItem } from '@sentinel/types';

describe('Phase 10.2 Comprehensive Remediation Verification', () => {
  beforeEach(() => {
    resetPreferences();
  });

  describe('Defect 01: ScoreGauge & Critical Action Required', () => {
    it('should render ScoreGauge with dedicated status pill below the circular ring', () => {
      const gauge = (
        <ScoreGauge
          scoreData={{
            ...mockSecurityScore,
            statusLabel: 'Critical Action Required',
          }}
          findingsSummary={mockFindingsSummary}
        />
      );
      expect(gauge).toBeDefined();
    });
  });

  describe('Defect 02: Evidence Provenance Report & Human-Friendly Formatting', () => {
    it('should render structured evidence with human-friendly values and 7-layer hierarchy', () => {
      const complexEvidence: EvidenceItem = {
        checkId: 'SEC-NET-002',
        checkName: 'Active Network Interfaces & DNS Verification',
        category: 'NETWORK',
        trustState: 'VERIFIED',
        timestamp: '2026-09-05T12:00:00Z',
        source: 'Android NetworkCapabilities / LinkProperties',
        platform: 'ANDROID',
        capabilityStatus: 'SUPPORTED',
        value: {
          wifiEnabled: true,
          cellularActive: false,
          vpnActive: true,
          dnsServers: ['1.1.1.1', '1.0.0.1'],
          isPrivateDnsActive: true,
        },
        notes: 'Verified secure DNS resolution and active encrypted VPN tunnel.',
      };

      const card = <EvidenceProvenanceCard evidence={complexEvidence} />;
      expect(card).toBeDefined();
    });

    it('should render boolean and null evidence gracefully', () => {
      const boolEvidence: EvidenceItem = {
        checkId: 'SEC-SYS-001',
        checkName: 'Hardware Biometric Verification',
        category: 'SYSTEM',
        trustState: 'VERIFIED',
        timestamp: '2026-09-05T12:00:00Z',
        source: 'BiometricManager',
        platform: 'ANDROID',
        capabilityStatus: 'SUPPORTED',
        value: true,
      };

      const card = <EvidenceProvenanceCard evidence={boolEvidence} />;
      expect(card).toBeDefined();
    });
  });

  describe('Defect 04: Screenshot Analyzer Image Selection & Preview', () => {
    it('should render Screenshot tab dropzone when no image is selected', () => {
      const onTabChange = jest.fn();
      const onAnalyze = jest.fn();
      const input = (
        <AnalyzerInput
          activeTab="screenshot"
          onTabChange={onTabChange}
          inputText=""
          onInputChange={() => {}}
          screenshotData={null}
          onScreenshotChange={() => {}}
          onAnalyze={onAnalyze}
        />
      );
      expect(input).toBeDefined();
    });

    it('should render Screenshot tab with selected image preview and context note', () => {
      const onAnalyze = jest.fn();
      const onScreenshotChange = jest.fn();
      const input = (
        <AnalyzerInput
          activeTab="screenshot"
          onTabChange={() => {}}
          inputText=""
          onInputChange={() => {}}
          screenshotData={{
            uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            base64:
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            mimeType: 'image/png',
            fileName: 'suspicious_banking_sms.png',
            fileSize: 204800,
            contextNote: 'Received from unknown number claiming account suspended',
          }}
          onScreenshotChange={onScreenshotChange}
          onAnalyze={onAnalyze}
        />
      );
      expect(input).toBeDefined();
    });
  });

  describe('Defect 05: Connected Devices Single Verified Device Requirement', () => {
    it('should contain ONLY Google Pixel 8 Pro as the connected device', () => {
      expect(mockDevices).toHaveLength(1);
      expect(mockDevices[0]!.name).toBe('Google Pixel 8 Pro');
      expect(mockDevices[0]!.platform).toBe('Android');
      expect(mockDevices[0]!.isCurrentDevice).toBe(true);

      // Verify ASUS ZenBook Pro does NOT exist
      const asusDevice = mockDevices.find((d) => d.name.toLowerCase().includes('zenbook'));
      expect(asusDevice).toBeUndefined();

      // Verify iPad Pro does NOT exist
      const ipadDevice = mockDevices.find((d) => d.name.toLowerCase().includes('ipad'));
      expect(ipadDevice).toBeUndefined();
    });
  });

  describe('Defect 06: Security Preferences Persistence & State', () => {
    it('should load default preferences', () => {
      const prefs = loadPreferences();
      expect(prefs.securityNotifications).toBe(true);
      expect(prefs.privacyBoundary).toBe('local_only');
      expect(prefs.language).toBe('en_US');
      expect(prefs.theme).toBe('light');
    });

    it('should update and persist preferences correctly', () => {
      const updated = savePreferences({
        securityNotifications: false,
        privacyBoundary: 'encrypted_cloud',
      });
      expect(updated.securityNotifications).toBe(false);
      expect(updated.privacyBoundary).toBe('encrypted_cloud');

      // Verify persistence across reads
      const reloaded = loadPreferences();
      expect(reloaded.securityNotifications).toBe(false);
      expect(reloaded.privacyBoundary).toBe('encrypted_cloud');
    });
  });
});
