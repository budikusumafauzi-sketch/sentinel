import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Icon } from '../../src/components/common/Icon';
import { AnalyzerInput, type AnalyzerTab } from '../../src/components/analyzer/AnalyzerInput';
import { AnalyzerResultCard } from '../../src/components/analyzer/AnalyzerResultCard';
import { mockThreatAnalysis } from '../../src/mock/securityData';
import type { ThreatAnalyzerResult } from '../../src/types/security';

export default function IntelligenceScreen() {
  const [activeTab, setActiveTab] = useState<AnalyzerTab>('message');
  const [inputText, setInputText] = useState(
    'Selamat! Akun Anda akan diblokir. Klik link ini untuk verifikasi akun Anda: http://secure-login-update.com',
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalyzerResult | null>(
    mockThreatAnalysis,
  );

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate UI analysis transition
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        ...mockThreatAnalysis,
        type: activeTab,
        inputSummary: inputText.slice(0, 100) + '...',
      });
    }, 500);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setInputText('');
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Security Intelligence"
        subtitle="Digital threat analysis and proactive advisor"
      />

      {/* Section 1: Threat Analyzer */}
      <SectionHeader title="Threat & Phishing Analyzer" />
      <AnalyzerInput
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'url') {
            setInputText('http://secure-login-update.com/verify-account');
          } else if (tab === 'screenshot') {
            setInputText('screenshot_login_prompt_suspicious.png');
          } else {
            setInputText(
              'Selamat! Akun Anda akan diblokir. Klik link ini untuk verifikasi akun Anda: http://secure-login-update.com',
            );
          }
        }}
        inputText={inputText}
        onInputChange={setInputText}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Result */}
      {analysisResult && <AnalyzerResultCard result={analysisResult} onReset={handleReset} />}

      {/* Section 2: Exposure Monitoring (PRD Section 24) */}
      <SectionHeader title="Exposure & Identity Monitoring" />
      <Card variant="outlined" padding="md" style={styles.exposureCard}>
        <View style={styles.exposureHeader}>
          <View style={styles.exposureIconCircle}>
            <Icon name="eye" size={20} color={colors.primary} />
          </View>
          <View style={styles.exposureInfo}>
            <Text style={styles.exposureTitle}>Primary Monitored Identity</Text>
            <Text style={styles.exposureSub}>fauzi@example.com · 0 active leaks found</Text>
          </View>
        </View>
        <View style={styles.exposureStatusBox}>
          <Text style={styles.exposureStatusText}>
            ✓ No unauthorized credential exposures detected in monitored breach datasets.
          </Text>
        </View>
      </Card>

      {/* Section 3: Threat Intelligence Feed Highlights */}
      <SectionHeader title="Global Threat Intelligence" />
      <Card variant="outlined" padding="md" style={styles.intelCard}>
        <View style={styles.intelItem}>
          <View style={styles.intelHeader}>
            <Text style={styles.intelTag}>ACTIVE ADVISORY</Text>
            <Text style={styles.intelTime}>2 hours ago</Text>
          </View>
          <Text style={styles.intelTitle}>
            SMS Phishing Impersonating Banking Verification Portals
          </Text>
          <Text style={styles.intelDesc}>
            Spike in phishing lures utilizing urgent account suspension SMS lures with misspelled
            domains.
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  exposureCard: {
    marginBottom: spacing.lg,
  },
  exposureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exposureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exposureInfo: {
    flex: 1,
  },
  exposureTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  exposureSub: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  exposureStatusBox: {
    backgroundColor: colors.secureBg,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
  },
  exposureStatusText: {
    fontSize: fontSizes.xs,
    color: colors.secureDark,
    fontWeight: fontWeights.medium,
  },
  intelCard: {
    marginBottom: spacing.xxl,
  },
  intelItem: {
    paddingVertical: 2,
  },
  intelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  intelTag: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: colors.highDark,
    letterSpacing: 0.5,
  },
  intelTime: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
  },
  intelTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  intelDesc: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
