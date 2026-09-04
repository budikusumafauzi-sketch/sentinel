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
import { FullReportView } from '../../src/components/security/FullReportView';
import { deviceScanner, type ScanStageProgress } from '../../src/services/deviceScanner';
import { securityStore } from '../../src/services/securityStore';
import type { DeviceInspectionResult } from '@sentinel/types';
import type { ScanProgress } from '../../src/types/security';

type ScanScreenState = 'idle' | 'scanning' | 'result' | 'report' | 'fullReport' | 'error';

const SCAN_STAGES = [
  {
    id: '1',
    name: 'Device Baseline',
    detail: 'Detecting manufacturer, model, OS version and hardware baseline',
    status: 'pending' as const,
  },
  {
    id: '2',
    name: 'Operating System & Security',
    detail: 'Inspecting keyguard, encryption, developer settings and security patch',
    status: 'pending' as const,
  },
  {
    id: '3',
    name: 'Application & Permissions',
    detail: 'Discovering visible packages and permission declarations within platform limits',
    status: 'pending' as const,
  },
  {
    id: '4',
    name: 'Network & Connectivity',
    detail: 'Checking network status, transports, and active VPN detection',
    status: 'pending' as const,
  },
  {
    id: '5',
    name: 'Capabilities & Synchronization',
    detail: 'Normalizing evidence provenance and synchronizing with backend',
    status: 'pending' as const,
  },
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
    checksCompleted:
      inspectionResult?.rawEvidence.length || Math.min(Math.floor((progressVal / 100) * 12), 12),
    totalChecks: 12,
    isScanning: screenState === 'scanning',
  };

  if (screenState === 'error') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Scan Failed" subtitle="Device inspection encountered an error" />
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View
            style={[
              styles.successIconCircle,
              { borderColor: '#FCA5A5', backgroundColor: '#FEE2E2' },
            ]}
          >
            <Icon name="alert-triangle" size={36} color="#DC2626" />
          </View>
          <Text style={styles.resultTitle}>Inspection Interrupted</Text>
          <Text style={styles.resultSubtitle}>
            {errorMessage || 'An unexpected platform error occurred.'}
          </Text>
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

  // Full Security Report View
  if (screenState === 'fullReport') {
    const fullReportData = securityStore.getReportViewData();
    if (fullReportData) {
      return (
        <ScreenContainer>
          <FullReportView report={fullReportData} onBack={() => setScreenState('result')} />
        </ScreenContainer>
      );
    }
  }

  // Evidence Provenance Report View
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
                Value:{' '}
                {typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}
              </Text>
              {item.notes ? (
                <Text style={styles.evidenceNotes}>Limitation: {item.notes}</Text>
              ) : null}
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
    const report = (inspectionResult as any).report || securityStore.getReport();
    const score = report?.overallScore ?? null;
    const findings = report?.findings ?? [];
    const activeFindings = findings.filter((f: any) => f.status === 'ACTIVE');
    const findingCounts = report?.findingCounts ?? { critical: 0, high: 0, medium: 0, low: 0 };

    const scoreColor =
      score === null
        ? colors.textMuted
        : score >= 80
          ? colors.secure
          : score >= 50
            ? colors.warning
            : colors.danger;

    return (
      <ScreenContainer>
        <ScreenHeader
          title="Inspection Completed"
          subtitle="Deterministic security intelligence evaluated"
        />

        {/* Phase 5 Security Score & Status Card */}
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreNumber, { color: scoreColor }]}>
              {score !== null ? score : '--'}
            </Text>
            <Text style={styles.scoreScale}>/ 100</Text>
          </View>

          <Text style={styles.resultTitle}>
            {score === null
              ? 'Insufficient Coverage'
              : score >= 80
                ? 'Device Posture Healthy'
                : score >= 50
                  ? 'Attention Required'
                  : 'Critical Action Needed'}
          </Text>

          <Text style={styles.resultSubtitle}>
            {report?.summary ||
              (activeFindings.length === 0
                ? 'Based on the checks available to Sentinel, no active security issues were detected.'
                : `${activeFindings.length} security finding(s) detected.`)}
          </Text>

          {/* Severity Counters Row */}
          <View style={styles.severityRow}>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.critical.dark }]}>
                {findingCounts.critical}
              </Text>
              <Text style={styles.severityLabel}>Critical</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.high.dark }]}>
                {findingCounts.high}
              </Text>
              <Text style={styles.severityLabel}>High</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.medium.dark }]}>
                {findingCounts.medium}
              </Text>
              <Text style={styles.severityLabel}>Medium</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.low.dark }]}>
                {findingCounts.low}
              </Text>
              <Text style={styles.severityLabel}>Low</Text>
            </View>
          </View>
        </Card>

        {/* Evaluated Security Controls Summary */}
        <View style={styles.checksListContainer}>
          <Text style={styles.sectionTitle}>Evaluated Security Controls</Text>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="shield" size={18} color={colors.primary} />
              <Text style={styles.catName}>Operating System</Text>
            </View>
            <Text style={styles.catChecks}>
              Android {inspectionResult.deviceInfo.osVersion} (
              {inspectionResult.deviceInfo.securityPatch || 'Patch unexposed'})
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="lock" size={18} color={colors.primary} />
              <Text style={styles.catName}>Screen Lock & Storage</Text>
            </View>
            <Text style={styles.catChecks}>
              {inspectionResult.systemSignals['security.screen_lock']?.value
                ? 'Configured'
                : 'Disabled'}{' '}
              ·{' '}
              {String(
                inspectionResult.systemSignals['security.storage_encryption']?.value
                  ? 'Encrypted'
                  : 'Unencrypted',
              )}
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="grid" size={18} color={colors.primary} />
              <Text style={styles.catName}>Applications & Permissions</Text>
            </View>
            <Text style={styles.catChecks}>
              {inspectionResult.applicationDiscovery.totalDiscovered} Inspected (
              {report?.categoryScores?.['APPLICATIONS']?.score ?? 100} pts)
            </Text>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.catLeft}>
              <Icon name="wifi" size={18} color={colors.primary} />
              <Text style={styles.catName}>Network & Transport</Text>
            </View>
            <Text style={styles.catChecks}>
              {(inspectionResult.networkSignals['network.connectivity']?.value as any)?.isConnected
                ? 'Connected'
                : 'Offline'}{' '}
              · VPN:{' '}
              {inspectionResult.networkSignals['network.vpn_transport']?.value
                ? 'Active'
                : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <PrimaryButton
          title="View Full Security Report"
          onPress={() => setScreenState('fullReport')}
          icon="file-text"
          size="lg"
          style={styles.actionBtn}
        />
        <SecondaryButton
          title="View Evidence Provenance Report"
          onPress={() => setScreenState('report')}
          icon="info"
          size="md"
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
        title={
          scanType === 'quick' ? 'Start Quick Scan (~2s)' : 'Start Full Device Inspection (~5s)'
        }
        onPress={handleStartScan}
        icon="scan"
        size="lg"
        style={styles.startBtn}
      />

      {/* Transparency Note */}
      <View style={styles.transparencyBox}>
        <Text style={styles.transparencyText}>
          Sentinel inspects only authorized OS configurations and application signals. Private
          messages, photos, files, and credentials are never accessed, altered, or transferred.
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
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: fontWeights.heavy,
    lineHeight: 32,
  },
  scoreScale: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: -2,
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
    paddingHorizontal: spacing.sm,
    lineHeight: 20,
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
