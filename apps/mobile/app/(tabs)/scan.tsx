import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
import {
  mockScanStages,
  mockFindingsSummary,
  mockCategories,
  mockFullReport,
} from '../../src/mock/securityData';
import type { ScanProgress } from '../../src/types/security';

type ScanScreenState = 'idle' | 'scanning' | 'result' | 'report';

export default function ScanScreen() {
  const [screenState, setScreenState] = useState<ScanScreenState>('idle');
  const [scanType, setScanType] = useState<ScanType>('full');
  const [progressVal, setProgressVal] = useState(0);

  // Mock scan timer simulation for UX demonstration
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (screenState === 'scanning') {
      timer = setInterval(() => {
        setProgressVal((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setScreenState('result');
            return 100;
          }
          return prev + 20;
        });
      }, 400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [screenState]);

  const handleStartScan = () => {
    setProgressVal(0);
    setScreenState('scanning');
  };

  const handleCancelScan = () => {
    setProgressVal(0);
    setScreenState('idle');
  };

  const currentScanProgress: ScanProgress = {
    progress: progressVal,
    currentStage:
      progressVal < 30
        ? 'Detecting device & hardware baseline...'
        : progressVal < 60
          ? 'Checking operating system & kernel...'
          : progressVal < 90
            ? 'Inspecting applications & signatures...'
            : 'Evaluating security policies & risk score...',
    stages: mockScanStages.map((stage, idx) => {
      const stageThreshold = (idx + 1) * 14;
      if (progressVal >= stageThreshold) {
        return { ...stage, status: 'completed' };
      } else if (progressVal >= stageThreshold - 14) {
        return { ...stage, status: 'in_progress' };
      }
      return { ...stage, status: 'pending' };
    }),
    checksCompleted: Math.min(Math.floor((progressVal / 100) * 147), 147),
    totalChecks: 147,
    isScanning: screenState === 'scanning',
  };

  if (screenState === 'report') {
    return (
      <ScreenContainer>
        <FullReportView report={mockFullReport} onBack={() => setScreenState('result')} />
      </ScreenContainer>
    );
  }

  if (screenState === 'scanning') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Security Scan" />
        <ScanProgressView scanProgress={currentScanProgress} onCancel={handleCancelScan} />
      </ScreenContainer>
    );
  }

  if (screenState === 'result') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Scan Completed" />

        {/* Result Card */}
        <Card variant="elevated" padding="lg" style={styles.resultCard}>
          <View style={styles.successIconCircle}>
            <Icon name="check" size={36} color={colors.secureDark} />
          </View>
          <Text style={styles.resultTitle}>Scan Finished Successfully</Text>
          <Text style={styles.resultSubtitle}>147 checks evaluated across 6 categories</Text>

          {/* Severity Counters Row */}
          <View style={styles.severityRow}>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.critical.dark }]}>
                {mockFindingsSummary.critical}
              </Text>
              <Text style={styles.severityLabel}>Critical</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.high.dark }]}>
                {mockFindingsSummary.high}
              </Text>
              <Text style={styles.severityLabel}>High</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.medium.dark }]}>
                {mockFindingsSummary.medium}
              </Text>
              <Text style={styles.severityLabel}>Medium</Text>
            </View>
            <View style={styles.severityItem}>
              <Text style={[styles.severityCount, { color: severityColors.low.dark }]}>
                {mockFindingsSummary.low}
              </Text>
              <Text style={styles.severityLabel}>Low</Text>
            </View>
          </View>
        </Card>

        {/* Categories Checks List */}
        <View style={styles.checksListContainer}>
          <Text style={styles.sectionTitle}>Category Check Summary</Text>
          {mockCategories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={styles.catLeft}>
                <Icon name={cat.icon} size={18} color={colors.primary} />
                <Text style={styles.catName}>{cat.name}</Text>
              </View>
              <Text style={styles.catChecks}>{cat.checksCount} checks evaluated</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <PrimaryButton
          title="View Full Detailed Report"
          onPress={() => setScreenState('report')}
          icon="file-text"
          size="lg"
          style={styles.actionBtn}
        />
        <SecondaryButton
          title="Perform Another Scan"
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
          <Icon name="laptop" size={20} color={colors.primary} />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>Current Workstation (Sentinel Client)</Text>
          <Text style={styles.deviceMeta}>Last scanned today at 22:25 · 147 baseline checks</Text>
        </View>
      </Card>

      {/* Scan Mode Selection */}
      <Text style={styles.sectionTitle}>Choose Scan Depth</Text>
      <ScanTypeSelector selectedType={scanType} onSelect={setScanType} />

      {/* Start Button */}
      <PrimaryButton
        title={scanType === 'quick' ? 'Start Quick Scan (~5s)' : 'Start Full Deep Scan (~15s)'}
        onPress={handleStartScan}
        icon="scan"
        size="lg"
        style={styles.startBtn}
      />

      {/* Transparency Note */}
      <View style={styles.transparencyBox}>
        <Text style={styles.transparencyText}>
          Sentinel checks only authorized OS configurations and application signals. System files
          and private contents are never altered or transferred.
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
  },
  resultSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
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
  },
  actionBtn: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  actionBtnSecondary: {
    width: '100%',
    marginBottom: spacing.xxl,
  },
});
