import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, severityColors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { Icon } from '../../src/components/common/Icon';
import { PrimaryButton, SecondaryButton } from '../../src/components/common/Button';
import { ScanTypeSelector, type ScanType } from '../../src/components/scan/ScanTypeSelector';
import { ScanProgressView } from '../../src/components/scan/ScanProgressView';
import { deviceScanner, type ScanStageProgress } from '../../src/services/deviceScanner';
import type { DeviceInspectionResult } from '@sentinel/types';
import type { ScanProgress } from '../../src/types/security';

type ScanScreenState = 'idle' | 'scanning' | 'result' | 'report' | 'error';

const SCAN_STAGES = [
  { id: '1', name: 'Device Baseline', detail: 'Detecting manufacturer, model, OS version and hardware baseline', status: 'pending' as const },
  { id: '2', name: 'Operating System & Security', detail: 'Inspecting keyguard, encryption, developer settings and security patch', status: 'pending' as const },
  { id: '3', name: 'Application & Permissions', detail: 'Discovering visible packages and permission declarations within platform limits', status: 'pending' as const },
  { id: '4', name: 'Network & Connectivity', detail: 'Checking network status, transports, and active VPN detection', status: 'pending' as const },
  { id: '5', name: 'Capabilities & Synchronization', detail: 'Normalizing evidence provenance and synchronizing with backend', status: 'pending' as const },
];

export default function ScanScreen() {
  const [screenState, setScreenState] = useState<ScanScreenState>('idle');
  const [scanType, setScanType] = useState<ScanType>('full');
  const [progressVal, setProgressVal] = useState(0);
  const [currentStageText, setCurrentStageText] = useState('Initializing scan...');
  const [inspectionResult, setInspectionResult] = useState<DeviceInspectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartScan = async () => {
    setProgressVal(0);
    setCurrentStageText('Initializing device inspection...');
    setScreenState('scanning');
    setErrorMessage(null);

    try {
      const result = await deviceScanner.runScan((prog: ScanStageProgress) => {
        setProgressVal(prog.progress);
        setCurrentStageText(prog.stage);
      });
      setInspectionResult(result);
      setScreenState('result');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Inspection failed');
      setScreenState('error');
    }
  };

  const handleCancelScan = () => {
    setProgressVal(0);
    setScreenState('idle');
  };

  const currentScanProgress: ScanProgress = {
    progress: progressVal,
    currentStage: currentStageText,
    stages: SCAN_STAGES.map((stage, idx) => {
      const stageThreshold = (idx + 1) * 20;
      if (progressVal >= stageThreshold) {
        return { ...stage, status: 'completed' as const };
      } else if (progressVal >= stageThreshold - 20) {
        return { ...stage, status: 'in_progress' as const };
      }
      return { ...stage, status: 'pending' as const };
    }),
    checksCompleted: inspectionResult?.rawEvidence.length || Math.min(Math.floor((progressVal / 100) * 12), 12),
    totalChecks: 12,
    isScanning: screenState === 'scanning',
  };

  if (screenState === 'error') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Scan Failed" subtitle="Device inspection encountered an error" />
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View style={[styles.successIconCircle, { borderColor: '#FCA5A5', backgroundColor: '#FEE2E2' }]}>
            <Icon name="alert-triangle" size={36} color="#DC2626" />
          </View>
          <Text style={styles.resultTitle}>Inspection Interrupted</Text>
          <Text style={styles.resultSubtitle}>{errorMessage || 'An unexpected platform error occurred.'}</Text>
          <PrimaryButton
            title="Retry Scan"
            onPress={handleStartScan}
            icon="refresh"
            size="md"
            style={styles.actionBtn}
          />
          <SecondaryButton
            title="Return to Scan Screen"
            onPress={() => setScreenState('idle')}
            size="md"
            style={styles.actionBtnSecondary}
          />
        </Card>
      </ScreenContainer>
    );
  }

  if (screenState === 'report' && inspectionResult) {
    return (
      <ScreenContainer>
        <ScreenHeader
          title="Evidence Provenance Report"
          subtitle={`${inspectionResult.rawEvidence.length} signals recorded with data trust verification`}
        />
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {inspectionResult.rawEvidence.map((item, idx) => (
            <Card key={idx} variant="outlined" padding="md" style={styles.evidenceCard}>
              <View style={styles.evidenceHeader}>
                <Text style={styles.evidenceName}>{item.checkName}</Text>
                <View
                  style={[
                    styles.trustBadge,
                    item.trustState === 'VERIFIED'
                      ? styles.trustVerified
                      : item.trustState === 'PERMISSION_REQUIRED'
                        ? styles.trustPermReq
                        : styles.trustUnavailable,
                  ]}
                >
                  <Text style={styles.trustBadgeText}>{item.trustState}</Text>
                </View>
              </View>
              <Text style={styles.evidenceSource}>API Source: {item.source}</Text>
              <Text style={styles.evidenceValue}>
                Value: {typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
              </Text>
              {item.notes ? <Text style={styles.evidenceNotes}>Limitation: {item.notes}</Text> : null}
            </Card>
          ))}
          <PrimaryButton
            title="Back to Summary"
            onPress={() => setScreenState('result')}
            icon="chevron-left"
            size="md"
            style={styles.actionBtn}
          />
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (screenState === 'scanning') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Security Inspection" subtitle="Collecting real device evidence" />
        <ScanProgressView scanProgress={currentScanProgress} onCancel={handleCancelScan} />
      </ScreenContainer>
    );
  }

  if (screenState === 'result' && inspectionResult) {
    const verifiedCount = inspectionResult.rawEvidence.filter((e) => e.trustState === 'VERIFIED').length;
    const permReqCount = inspectionResult.rawEvidence.filter((e) => e.trustState === 'PERMISSION_REQUIRED').length;
    const partialCount = inspectionResult.rawEvidence.filter((e) => e.capabilityStatus === 'PARTIALLY_SUPPORTED').length;
    const unavailCount = inspectionResult.rawEvidence.filter(
      (e) => e.trustState === 'NOT_AVAILABLE' || e.trustState === 'UNABLE_TO_VERIFY',
    ).length;

    return (
      <ScreenContainer>
        <ScreenHeader title="Inspection Completed" subtitle="Device intelligence recorded truthfully" />

        {/* Result Card */}
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View style={styles.successIconCircle}>
            <Icon name="check" size={36} color={colors.secureDark} />
          </View>
          <Text style={styles.resultTitle}>
            {inspectionResult.applicationDiscovery.status === 'partially_discoverable'
              ? 'Completed with Platform Limits'
              : 'Scan Finished Successfully'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {inspectionResult.deviceInfo.manufacturer} {inspectionResult.deviceInfo.model} · Android {inspectionResult.deviceInfo.osVersion}
          </Text>

          {/* Provenance Counters Row */}
          <View style={styles.severityRow}>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: colors.secureDark }]}>{verifiedCount}</Text>
              <Text style={styles.severityLabel}>Verified</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.medium.dark }]}>{partialCount}</Text>
              <Text style={styles.severityLabel}>Partial</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.high.dark }]}>{permReqCount}</Text>
              <Text style={styles.severityLabel}>Perm Req</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: colors.textMuted }]}>{unavailCount}</Text>
              <Text style={styles.severityLabel}>Unavailable</Text>
            </View>
          </View>
        </Card>

        {/* Categories Checks List */}
        <View style={styles.checksListContainer}>
          <Text style={styles.sectionTitle}>Verified Signal Summary</Text>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="shield" size={18} color={colors.primary} />
              <Text style={styles.catName}>Operating System</Text>
            </View>
            <Text style={styles.catChecks}>
              Android {inspectionResult.deviceInfo.osVersion} ({inspectionResult.deviceInfo.securityPatch || 'Patch unexposed'})
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="lock" size={18} color={colors.primary} />
              <Text style={styles.catName}>Screen Lock & Storage</Text>
            </View>
            <Text style={styles.catChecks}>
              {inspectionResult.systemSignals['security.screen_lock']?.value ? 'PIN/Pattern Set' : 'No Lock'} · {String(inspectionResult.systemSignals['security.storage_encryption']?.value || 'Encrypted')}
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="grid" size={18} color={colors.primary} />
              <Text style={styles.catName}>Applications & Packages</Text>
            </View>
            <Text style={styles.catChecks}>
              {inspectionResult.applicationDiscovery.totalDiscovered} Discovered (Filtered by OS)
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="wifi" size={18} color={colors.primary} />
              <Text style={styles.catName}>Network & Transport</Text>
            </View>
            <Text style={styles.catChecks}>
              {(inspectionResult.networkSignals['network.connectivity']?.value as any)?.isConnected ? 'Connected' : 'Offline'} · VPN: {inspectionResult.networkSignals['network.vpn_transport']?.value ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="alert-circle" size={18} color={colors.textMuted} />
              <Text style={styles.catName}>Wi-Fi Network SSID</Text>
            </View>
            <Text style={styles.catChecks}>Requires Location Perm</Text>
          </View>
        </View>

        {/* Actions */}
        <PrimaryButton
          title="View Evidence Provenance Report"
          onPress={() => setScreenState('report')}
          icon="file-text"
          size="lg"
          style={styles.actionBtn}
        />
        <SecondaryButton
          title="Perform Another Inspection"
          onPress={() => setScreenState('idle')}
          icon="refresh"
          size="md"
          style={styles.actionBtnSecondary}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Security Scan"
        subtitle="Automatic personal security baseline inspection"
      />

      {/* Device Overview Card */}
      <Card variant="outlined" padding="md" style={styles.deviceBanner}>
        <View style={styles.deviceIconCircle}>
          <Icon name="smartphone" size={20} color={colors.primary} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>Local Device (Sentinel Client)</Text>
          <Text style={styles.deviceMeta}>Automatic native inspection · Read-only</Text>
        </View>
      </Card>

      {/* Scan Mode Selection */}
      <Text style={styles.sectionTitle}>Choose Scan Depth</Text>
      <ScanTypeSelector selectedType={scanType} onSelect={setScanType} />

      {/* Start Button */}
      <PrimaryButton
        title={scanType === 'quick' ? 'Start Quick Scan (~2s)' : 'Start Full Device Inspection (~5s)'}
        onPress={handleStartScan}
        icon="scan"
        size="lg"
        style={styles.startBtn}
      />

      {/* Transparency Note */}
      <View style={styles.transparencyBox}>
        <Text style={styles.transparencyText}>
          Sentinel inspects only authorized OS configurations and application signals. Private messages, photos, files, and credentials are never accessed, altered, or transferred.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  deviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  deviceIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  deviceMeta: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  startBtn: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  transparencyBox: {
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    marginBottom: spacing.xxl,
  },
  transparencyText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  resultCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secureBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  severityItem: {
    alignItems: 'center',
    flex: 1,
  },
  severityCount: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  severityLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  checksListContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  catChecks: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    maxWidth: '50%',
    textAlign: 'right',
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  actionBtnSecondary: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
  evidenceCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  evidenceName: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  trustVerified: {
    backgroundColor: colors.secureBg,
  },
  trustPermReq: {
    backgroundColor: '#FEF3C7',
  },
  trustUnavailable: {
    backgroundColor: colors.surfaceMuted,
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  evidenceSource: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  evidenceValue: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  evidenceNotes: {
    fontSize: fontSizes.xs,
    color: '#D97706',
    fontStyle: 'italic',
  },
});
