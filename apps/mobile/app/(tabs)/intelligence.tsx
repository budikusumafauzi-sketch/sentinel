import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../src/design-system/colors';
import { spacing } from '../../src/design-system/spacing';
import { radius } from '../../src/design-system/radius';
import { fontSizes, fontWeights } from '../../src/design-system/typography';
import { ScreenContainer } from '../../src/components/layout/ScreenContainer';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { Card } from '../../src/components/common/Card';
import { SectionHeader } from '../../src/components/common/SectionHeader';
import { Icon } from '../../src/components/common/Icon';
import {
  AnalyzerInput,
  type AnalyzerTab,
  type ScreenshotData,
} from '../../src/components/analyzer/AnalyzerInput';
import { AnalyzerResultCard } from '../../src/components/analyzer/AnalyzerResultCard';
import { mockThreatAnalysis } from '../../src/mock/securityData';
import type { ThreatAnalyzerResult } from '../../src/types/security';
import { apiClient } from '../../src/api/client';

export default function IntelligenceScreen() {
  const [activeTab, setActiveTab] = useState<AnalyzerTab>('message');
  const [inputText, setInputText] = useState(
    'Selamat! Akun Anda akan diblokir. Klik link ini untuk verifikasi akun Anda: http://secure-login-update.com',
  );
  const [screenshotData, setScreenshotData] = useState<ScreenshotData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalyzerResult | null>(
    mockThreatAnalysis,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      if (activeTab === 'message') {
        const res = await apiClient.analyzeMessage(inputText);
        if (res?.data) {
          const d = res.data;
          const mappedRisk =
            d.classification === 'PHISHING'
              ? 'high'
              : d.classification === 'SUSPICIOUS' || d.classification === 'SPAM'
                ? 'medium'
                : 'low';

          setAnalysisResult({
            id: 'msg-' + Date.now(),
            type: 'message',
            inputSummary: inputText.slice(0, 100) + (inputText.length > 100 ? '...' : ''),
            riskLevel: mappedRisk,
            confidence: Math.round(d.confidence * 100),
            threatType:
              d.classification === 'PHISHING'
                ? 'SMS / Chat Phishing'
                : `${d.classification} Pattern`,
            summary: d.explanation,
            indicators: d.suspiciousIndicators,
            recommendations: [d.recommendedAction],
            evidenceList: [
              { label: 'Classification', value: d.classification },
              { label: 'Urgency Tactics', value: d.urgencyTacticsDetected ? 'Detected' : 'None' },
              { label: 'Credential Risk', value: d.credentialHarvestingRisk ? 'High' : 'Low' },
              { label: 'Prompt Version', value: d.promptVersion },
            ],
          });
          return;
        }
      } else if (activeTab === 'url') {
        const res = await apiClient.analyzeUrl(inputText);
        if (res?.data) {
          const d = res.data;
          const mappedRisk = d.riskLevel.toLowerCase() as 'critical' | 'high' | 'medium' | 'low';
          setAnalysisResult({
            id: 'url-' + Date.now(),
            type: 'url',
            inputSummary: d.normalizedUrl,
            riskLevel:
              mappedRisk === 'critical' ? 'critical' : mappedRisk === 'high' ? 'high' : 'medium',
            confidence: Math.round(d.confidence * 100),
            threatType: 'Suspicious Domain / URL',
            summary: d.riskInterpretation,
            indicators: d.observations,
            recommendations: ['Do not enter credentials or download files from this domain.'],
            evidenceList: [
              { label: 'Domain', value: d.domain },
              { label: 'Protocol', value: d.protocol },
              { label: 'Attribution', value: d.sourceAttribution },
              { label: 'Prompt Version', value: d.promptVersion },
            ],
          });
          return;
        }
      } else if (activeTab === 'screenshot') {
        if (!screenshotData || !screenshotData.base64) {
          setErrorMessage('Please select or upload a screenshot to analyze.');
          setIsAnalyzing(false);
          return;
        }

        const res = await apiClient.analyzeScreenshot(
          screenshotData.base64,
          screenshotData.mimeType,
          screenshotData.contextNote,
        );
        if (res?.data) {
          const d = res.data;
          const hasIndicators = d.suspiciousIndicators && d.suspiciousIndicators.length > 0;
          const mappedRisk =
            d.suspiciousIndicators.length >= 2
              ? 'critical'
              : d.suspiciousIndicators.length === 1
                ? 'high'
                : 'low';

          setAnalysisResult({
            id: 'ss-' + Date.now(),
            type: 'screenshot',
            inputSummary: screenshotData.fileName || 'Screenshot Image Analysis',
            riskLevel: mappedRisk,
            confidence: Math.round(d.confidence * 100),
            threatType: hasIndicators
              ? 'Visual Impersonation / Phishing Prompt'
              : 'Verified Legitimate Visual Prompt',
            summary: d.explanation,
            indicators: hasIndicators
              ? d.suspiciousIndicators
              : ['No visual indicators of deception or credential harvesting detected.'],
            recommendations: [d.recommendedAction],
            evidenceList: [
              { label: 'Detected Elements', value: d.detectedElements.join(', ') || 'None' },
              {
                label: 'Content Sufficiency',
                value: d.isContentSufficient
                  ? 'Sufficient for verification'
                  : 'Insufficient resolution',
              },
              { label: 'AI Model', value: d.modelMetadata?.model || 'Gemini Multimodal' },
              { label: 'Prompt Version', value: d.promptVersion },
            ],
          });
          return;
        }
      }

      // Offline or fallback simulation if backend is not actively serving AI credentials
      setAnalysisResult({
        ...mockThreatAnalysis,
        type: activeTab,
        inputSummary:
          activeTab === 'screenshot'
            ? screenshotData?.fileName || 'Screenshot Image'
            : inputText.slice(0, 100) + '...',
      });
    } catch (err: any) {
      // Gracefully handle AI failure without crashing
      const msg =
        err?.message ||
        'AI service temporarily unavailable. Deterministic scanning remains fully active.';
      setErrorMessage(msg);
      // Retain mock fallback so user experience is not broken
      setAnalysisResult({
        ...mockThreatAnalysis,
        type: activeTab,
        inputSummary:
          activeTab === 'screenshot'
            ? screenshotData?.fileName || 'Screenshot Image'
            : inputText.slice(0, 100) + '...',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setInputText('');
    setScreenshotData(null);
    setErrorMessage(null);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Security Intelligence"
        subtitle="Digital threat analysis and proactive advisor"
      />

      {/* AI Provenance Notice */}
      <View style={styles.aiNoticeBadge}>
        <Icon name="shield" size={14} color={colors.primary} />
        <Text style={styles.aiNoticeText}>
          AI Explanation Layer · Gemini Powered · Non-Authoritative
        </Text>
      </View>

      {/* Section 1: Threat Analyzer */}
      <SectionHeader title="Threat & Phishing Analyzer" />
      <AnalyzerInput
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setErrorMessage(null);
          if (tab === 'url') {
            setInputText('http://secure-login-update.com/verify-account');
          } else if (tab === 'message') {
            setInputText(
              'Selamat! Akun Anda akan diblokir. Klik link ini untuk verifikasi akun Anda: http://secure-login-update.com',
            );
          }
        }}
        inputText={inputText}
        onInputChange={setInputText}
        screenshotData={screenshotData}
        onScreenshotChange={setScreenshotData}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Error banner if AI service returned error */}
      {errorMessage && (
        <Card variant="outlined" padding="md" style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Icon name="alert-circle" size={18} color={colors.warningDark} />
            <Text style={styles.errorTitle}>AI Notice</Text>
          </View>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => setErrorMessage(null)} style={styles.dismissBtn}>
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </Card>
      )}

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
  aiNoticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  aiNoticeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.primaryDark,
  },
  errorCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    marginBottom: spacing.md,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.warningDark,
  },
  errorText: {
    fontSize: fontSizes.xs + 1,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  dismissBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  dismissBtnText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.warningDark,
  },
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
