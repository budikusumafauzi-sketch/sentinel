import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { SeverityBadge } from '../common/Badge';
import { Icon } from '../common/Icon';
import type { Finding } from '../../types/security';
import { apiClient } from '../../api/client';
import type { SecurityExplanationResult } from '@sentinel/types';

interface FindingCardProps {
  finding: Finding;
  onTakeAction?: (finding: Finding) => void;
  style?: ViewStyle;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, onTakeAction, style }) => {
  const [expanded, setExpanded] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<SecurityExplanationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleExplainWithAi = async () => {
    if (aiExplanation) {
      // Toggle off if already showing
      setAiExplanation(null);
      return;
    }

    setIsExplaining(true);
    setAiError(null);

    try {
      const res = await apiClient.explainFinding(finding.id);
      if (res?.data) {
        setAiExplanation(res.data);
      } else {
        // Fallback local explanation if backend returns empty
        setAiExplanation({
          findingId: finding.id,
          summary: finding.description,
          explanation: finding.whyItMatters,
          whyItMatters: finding.whyItMatters,
          evidenceReferences: finding.evidence.map((e) => e.label),
          impact: 'Potential exposure based on verified device signal.',
          remediation: finding.recommendation,
          limitations: ['Standard contextual explanation.'],
          confidence: finding.confidence / 100,
          promptVersion: 'SECURITY_EXPLANATION_V1',
          modelMetadata: { provider: 'sentinel-local', model: 'deterministic-context' },
          provenance: {
            sourceEvidenceVerified: true,
            deterministicEngineAuthoritative: true,
            aiInterpretationOnly: true,
            generatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      // Gracefully handle AI unavailable without crashing
      setAiError(
        err?.message ||
          'AI explanation is temporarily unavailable. The verified finding remains active.',
      );
      // Fallback local explanation
      setAiExplanation({
        findingId: finding.id,
        summary: finding.description,
        explanation: finding.whyItMatters,
        whyItMatters: finding.whyItMatters,
        evidenceReferences: finding.evidence.map((e) => e.label),
        impact: 'Impact assessed by deterministic security engine.',
        remediation: finding.recommendation,
        limitations: ['AI service unavailable; displaying baseline engine context.'],
        confidence: finding.confidence / 100,
        promptVersion: 'SECURITY_EXPLANATION_V1',
        modelMetadata: { provider: 'fallback', model: 'baseline' },
        provenance: {
          sourceEvidenceVerified: true,
          deterministicEngineAuthoritative: true,
          aiInterpretationOnly: true,
          generatedAt: new Date().toISOString(),
        },
      });
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <Card variant="outlined" padding="lg" style={[styles.card, style]}>
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <SeverityBadge severity={finding.severity} size="sm" />
        <Text style={styles.categoryText}>{finding.category}</Text>
      </View>

      {/* Finding Title */}
      <Text style={styles.title}>{finding.title}</Text>

      {/* Description */}
      <Text style={styles.description}>{finding.description}</Text>

      {/* Why it Matters Section */}
      <View style={styles.whyBox}>
        <Text style={styles.whyHeader}>Why does it matter?</Text>
        <Text style={styles.whyContent}>{finding.whyItMatters}</Text>
      </View>

      {/* Recommendation Section */}
      <View style={styles.recBox}>
        <Text style={styles.recHeader}>Recommendation</Text>
        <Text style={styles.recContent}>{finding.recommendation}</Text>
      </View>

      {/* AI Explanation Toggle Button */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={handleExplainWithAi}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Explain finding with AI"
      >
        {isExplaining ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Icon name="shield" size={16} color={colors.primary} />
            <Text style={styles.aiButtonText}>
              {aiExplanation ? 'Hide AI Explanation' : 'Explain with AI Intelligence'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* AI Explanation Box */}
      {aiExplanation && (
        <View style={styles.aiContainer}>
          <View style={styles.aiHeaderRow}>
            <Text style={styles.aiHeaderTag}>AI EXPLANATION · GEMINI</Text>
            <Text style={styles.aiNonAuthTag}>NON-AUTHORITATIVE</Text>
          </View>

          <Text style={styles.aiSummaryText}>{aiExplanation.summary}</Text>

          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Why It Matters:</Text>
            <Text style={styles.aiDetailText}>{aiExplanation.whyItMatters}</Text>
          </View>

          <View style={styles.aiDetailRow}>
            <Text style={styles.aiDetailLabel}>Actionable Guidance:</Text>
            <Text style={styles.aiDetailText}>{aiExplanation.remediation}</Text>
          </View>

          {aiExplanation.limitations && aiExplanation.limitations.length > 0 && (
            <View style={styles.aiLimitationsBox}>
              <Text style={styles.aiLimitationsTitle}>Known Limitations:</Text>
              {aiExplanation.limitations.map((lim, idx) => (
                <Text key={idx} style={styles.aiLimitationItem}>
                  • {lim}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.aiDisclaimer}>
            * The deterministic Phase 5 engine score and severity are authoritative. AI provides
            plain-language interpretation only.
          </Text>
        </View>
      )}

      {/* Confidence & Action */}
      <View style={styles.footerRow}>
        <View style={styles.confidencePill}>
          <Text style={styles.confidenceLabel}>
            Confidence: <Text style={styles.confidenceVal}>{finding.confidence}%</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.evidenceToggle}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Toggle technical evidence"
        >
          <Text style={styles.evidenceToggleText}>
            {expanded ? 'Hide Evidence' : 'View Evidence'}
          </Text>
          <Icon
            name={expanded ? 'chevron-down' : 'chevron-right'}
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Expandable Technical Evidence */}
      {expanded && (
        <View style={styles.evidenceContainer}>
          <Text style={styles.evidenceTitle}>Technical Evidence</Text>
          {finding.evidence.map((item, idx) => (
            <View key={idx} style={styles.evidenceRow}>
              <Text style={styles.evidenceLabel}>{item.label}:</Text>
              <Text style={styles.evidenceValue}>{item.value}</Text>
            </View>
          ))}
          {onTakeAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onTakeAction(finding)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Take action on finding: ${finding.title}`}
            >
              <Text style={styles.actionButtonText}>Take Action on Finding</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: fontWeights.medium,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  whyBox: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  whyHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyContent: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  recHeader: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recContent: {
    fontSize: fontSizes.xs + 1,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  aiButtonText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  aiContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aiHeaderTag: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  aiNonAuthTag: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  aiSummaryText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  aiDetailRow: {
    marginBottom: spacing.xs,
  },
  aiDetailLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  aiDetailText: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  aiLimitationsBox: {
    backgroundColor: '#F1F5F9',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  aiLimitationsTitle: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    marginBottom: 2,
  },
  aiLimitationItem: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    lineHeight: 16,
  },
  aiDisclaimer: {
    fontSize: fontSizes.xs - 2,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  confidencePill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  confidenceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  confidenceVal: {
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  evidenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  evidenceToggleText: {
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  evidenceContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  evidenceTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  evidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  evidenceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  evidenceValue: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: fontWeights.medium,
    flex: 2,
    textAlign: 'right',
  },
  actionButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.textInverse,
    fontSize: fontSizes.xs + 1,
    fontWeight: fontWeights.semibold,
  },
});
