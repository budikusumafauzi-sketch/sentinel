import React from 'react';
import OverviewScreen from '../app/(tabs)/index';
import ScanScreen from '../app/(tabs)/scan';
import ProtectScreen from '../app/(tabs)/protect';
import IntelligenceScreen from '../app/(tabs)/intelligence';
import ProfileScreen from '../app/(tabs)/profile';
import { FullReportView } from '../src/components/security/FullReportView';
import { ScanProgressView } from '../src/components/scan/ScanProgressView';
import { mockFullReport, mockScanStages } from '../src/mock/securityData';

describe('Sentinel Screen Foundation', () => {
  it('should render OverviewScreen without errors', () => {
    const screen = <OverviewScreen />;
    expect(screen).toBeDefined();
  });

  it('should render ScanScreen without errors', () => {
    const screen = <ScanScreen />;
    expect(screen).toBeDefined();
  });

  it('should render ProtectScreen without errors', () => {
    const screen = <ProtectScreen />;
    expect(screen).toBeDefined();
  });

  it('should render IntelligenceScreen without errors', () => {
    const screen = <IntelligenceScreen />;
    expect(screen).toBeDefined();
  });

  it('should render ProfileScreen without errors', () => {
    const screen = <ProfileScreen />;
    expect(screen).toBeDefined();
  });

  it('should render FullReportView and ScanProgressView without errors', () => {
    const report = <FullReportView report={mockFullReport} />;
    const progress = (
      <ScanProgressView
        scanProgress={{
          progress: 82,
          currentStage: 'Inspecting applications...',
          stages: mockScanStages,
          checksCompleted: 120,
          totalChecks: 147,
          isScanning: true,
        }}
      />
    );
    expect(report).toBeDefined();
    expect(progress).toBeDefined();
  });
});
