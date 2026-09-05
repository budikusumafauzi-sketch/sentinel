import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type ViewStyle } from 'react-native';
import { colors } from '../../design-system/colors';
import { radius } from '../../design-system/radius';
import { spacing } from '../../design-system/spacing';
import { fontSizes, fontWeights } from '../../design-system/typography';
import { Card } from '../common/Card';
import { Icon, type IconName } from '../common/Icon';
import type { EvidenceItem } from '@sentinel/types';

interface EvidenceProvenanceCardProps {
  evidence: EvidenceItem;
  style?: ViewStyle;
}

export const EvidenceProvenanceCard: React.FC<EvidenceProvenanceCardProps> = ({
  evidence,
  style,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // 1. Trust state formatting
  const getTrustBadgeConfig = (trust: string) => {
    switch (trust) {
      case 'VERIFIED':
        return {
          label: 'VERIFIED',
          icon: 'check' as IconName,
          bgColor: colors.secureBg,
          borderColor: '#A7F3D0',
          textColor: colors.secureDark,
        };
      case 'PERMISSION_REQUIRED':
        return {
          label: 'PERMISSION REQUIRED',
          icon: 'alert-triangle' as IconName,
          bgColor: '#FEF3C7',
          borderColor: '#FCD34D',
          textColor: '#B45309',
        };
      case 'NOT_AVAILABLE':
        return {
          label: 'NOT AVAILABLE',
          icon: 'alert-circle' as IconName,
          bgColor: '#F3F4F6',
          borderColor: '#E5E7EB',
          textColor: '#4B5563',
        };
      case 'UNABLE_TO_VERIFY':
      default:
        return {
          label: 'UNABLE TO VERIFY',
          icon: 'info' as IconName,
          bgColor: '#F1F5F9',
          borderColor: '#CBD5E1',
          textColor: '#475569',
        };
    }
  };

  const trustConfig = getTrustBadgeConfig(evidence.trustState);

  // 2. Human-friendly value formatting (Never raw unformatted JSON)
  const formatUserFriendlyValue = (
    item: EvidenceItem,
  ): { primary: string; details?: { label: string; value: string }[] } => {
    const { checkId, value } = item;

    // Boolean / State specific checks
    if (checkId === 'security.screen_lock') {
      return {
        primary:
          value === true
            ? 'Configured & Active'
            : value === false
              ? 'Disabled / Not Configured'
              : 'Status Unknown',
      };
    }
    if (checkId === 'security.storage_encryption') {
      return {
        primary:
          value === 'ACTIVE' || value === true ? 'Hardware Encryption Active' : 'Unencrypted',
      };
    }
    if (checkId === 'system.developer_options') {
      return {
        primary:
          value === false ? 'Disabled (Recommended Secure Baseline)' : 'Enabled (Developer Mode)',
      };
    }
    if (checkId === 'system.usb_debugging') {
      return {
        primary:
          value === false
            ? 'Disabled (Recommended Secure Baseline)'
            : 'Enabled (Debugging Interface Active)',
      };
    }
    if (checkId === 'package.unknown_sources') {
      return {
        primary:
          value === false
            ? 'Blocked (Restricted to Authorized Stores)'
            : 'Allowed (Sideloading Permitted)',
      };
    }
    if (checkId === 'security.biometrics') {
      return {
        primary:
          value === 'AVAILABLE'
            ? 'Hardware Present & Enrolled'
            : value === 'NOT_ENROLLED'
              ? 'Hardware Present, Not Enrolled'
              : String(value),
      };
    }

    // Network connectivity object
    if (checkId === 'network.connectivity' && typeof value === 'object' && value !== null) {
      const v = value as any;
      const details: { label: string; value: string }[] = [];
      if (v.isConnected !== undefined)
        details.push({ label: 'Connection', value: v.isConnected ? 'Connected' : 'Disconnected' });
      if (v.hasInternet !== undefined)
        details.push({ label: 'Internet Access', value: v.hasInternet ? 'Active' : 'No Internet' });
      if (v.isWifi) details.push({ label: 'Interface', value: 'Wi-Fi' });
      if (v.isCellular) details.push({ label: 'Interface', value: 'Cellular' });
      if (v.isValidated !== undefined)
        details.push({ label: 'Network Validated', value: v.isValidated ? 'Yes' : 'No' });

      return {
        primary: v.isConnected
          ? v.isWifi
            ? 'Connected via Wi-Fi'
            : v.isCellular
              ? 'Connected via Cellular'
              : 'Connected'
          : 'Offline',
        details: details.length > 0 ? details : undefined,
      };
    }

    // Installed application discovery object
    if (checkId === 'application.discovery' && typeof value === 'object' && value !== null) {
      const v = value as any;
      const details: { label: string; value: string }[] = [];
      if (v.totalDiscovered !== undefined)
        details.push({ label: 'Discovered', value: `${v.totalDiscovered} packages` });
      if (v.status) details.push({ label: 'Inspection Status', value: v.status });

      return {
        primary: v.totalDiscovered
          ? `${v.totalDiscovered} Applications Inspected`
          : 'Limited Application Visibility',
        details: details.length > 0 ? details : undefined,
      };
    }

    // Active VPN
    if (checkId === 'network.vpn_transport') {
      return {
        primary: value === true ? 'Active VPN Connection Detected' : 'No Active VPN Detected',
      };
    }

    // OS Security Patch
    if (checkId === 'os.security_patch') {
      return {
        primary: value ? `Patch Level: ${value}` : 'Patch Level Not Exposed',
      };
    }

    // Hardware Attestation
    if (checkId === 'hardware.attestation') {
      return {
        primary:
          value === null ? 'Standalone Client (Cloud Attestation Unavailable)' : String(value),
      };
    }

    // Objects fallback: format into human readable pairs instead of JSON dump
    if (typeof value === 'object' && value !== null) {
      const pairs = Object.entries(value).map(([k, v]) => ({
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      }));
      return {
        primary: `${item.checkName} Signals Recorded`,
        details: pairs,
      };
    }

    // Primitive fallback
    return {
      primary:
        value !== null && value !== undefined && value !== '' ? String(value) : 'Not Available',
    };
  };

  // 3. Explanation mapping based on check
  const getExplanation = (checkId: string): string => {
    switch (checkId) {
      case 'device.manufacturer':
      case 'device.model':
      case 'os.version':
        return 'Authenticates device hardware identity and baseline operating system release platform.';
      case 'os.security_patch':
        return 'Evaluates vulnerability mitigation currency against known CVE security advisories.';
      case 'security.screen_lock':
        return 'Verifies hardware cryptographic keyguard enforcement preventing physical device takeover.';
      case 'security.biometrics':
        return 'Confirms presence of secure biometric hardware and user enrollment state.';
      case 'security.storage_encryption':
        return 'Validates full filesystem and user-data partition encryption at rest.';
      case 'system.developer_options':
        return 'Inspects whether developer modifications or untrusted debugging facilities are active.';
      case 'system.usb_debugging':
        return 'Checks if Android Debug Bridge (ADB) interface is exposed over physical USB connections.';
      case 'package.unknown_sources':
        return 'Audits package installer security configuration against untrusted side-loaded binaries.';
      case 'network.connectivity':
        return 'Inspects current network interface transport characteristics and connectivity validation.';
      case 'network.vpn_transport':
        return 'Detects virtual private network tunneling status and traffic protection boundaries.';
      case 'application.discovery':
        return 'Inspects installed application packages within OS-enforced sandboxing boundaries.';
      case 'network.wifi_ssid':
        return 'Checks local wireless access point identity for rouge network detection.';
      case 'hardware.attestation':
        return 'Evaluates hardware-backed cryptographic root-of-trust and secure element attestation.';
      default:
        return 'System security signal evaluated by Sentinel personal cybersecurity engine.';
    }
  };

  const formatted = formatUserFriendlyValue(evidence);
  const explanation = getExplanation(evidence.checkId);

  return (
    <Card variant="outlined" padding="md" style={[styles.card, style]}>
      {/* 1. Header: Title & Trust Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.checkTitle}>{evidence.checkName}</Text>
        </View>
        <View
          style={[
            styles.trustBadge,
            {
              backgroundColor: trustConfig.bgColor,
              borderColor: trustConfig.borderColor,
            },
          ]}
          accessible={true}
          accessibilityLabel={`Trust status: ${trustConfig.label}`}
        >
          <Text style={[styles.trustBadgeText, { color: trustConfig.textColor }]}>
            {trustConfig.label}
          </Text>
        </View>
      </View>

      {/* 2. User-Friendly Result / Value */}
      <View style={styles.valueContainer}>
        <Text style={styles.valuePrimary}>{formatted.primary}</Text>
        {formatted.details && formatted.details.length > 0 && (
          <View style={styles.detailsGrid}>
            {formatted.details.map((d, i) => (
              <View key={i} style={styles.detailItem}>
                <Text style={styles.detailLabel}>{d.label}:</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 3. Explanation */}
      <Text style={styles.explanationText}>{explanation}</Text>

      {/* 4. Limitation Note / Verification Boundary Callout (if present) */}
      {evidence.notes ? (
        <View style={styles.limitationCallout}>
          <View style={styles.limitationHeader}>
            <Icon name="info" size={14} color="#D97706" />
            <Text style={styles.limitationTitle}>Platform Boundary / Limitation</Text>
          </View>
          <Text style={styles.limitationBody}>{evidence.notes}</Text>
        </View>
      ) : null}

      {/* 5. Technical Provenance Toggle & Accordion */}
      <TouchableOpacity
        style={styles.provenanceToggle}
        onPress={() => setShowTechnicalDetails(!showTechnicalDetails)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Toggle technical provenance details"
      >
        <Text style={styles.provenanceToggleText}>
          {showTechnicalDetails ? '▾ Hide Technical Provenance' : '▸ View Technical Provenance'}
        </Text>
        <Text style={styles.sourceShort}>
          API: {evidence.source.split('.').slice(-2).join('.')}
        </Text>
      </TouchableOpacity>

      {showTechnicalDetails && (
        <View style={styles.technicalBox}>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Check ID:</Text>
            <Text style={styles.techMono}>{evidence.checkId}</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>API Source:</Text>
            <Text style={styles.techMono}>{evidence.source}</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Recorded At:</Text>
            <Text style={styles.techMono}>{evidence.timestamp}</Text>
          </View>
          {evidence.category && (
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Category:</Text>
              <Text style={styles.techMono}>{evidence.category}</Text>
            </View>
          )}
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Raw Value:</Text>
            <Text style={styles.techMono}>
              {typeof evidence.value === 'object'
                ? JSON.stringify(evidence.value, null, 2)
                : String(evidence.value)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  titleContainer: {
    flex: 1,
  },
  checkTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  trustBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  trustBadgeText: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },
  valueContainer: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginVertical: spacing.xs + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  valuePrimary: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  detailsGrid: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
    gap: 3,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  explanationText: {
    fontSize: fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  limitationCallout: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  limitationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  limitationTitle: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: '#92400E',
  },
  limitationBody: {
    fontSize: fontSizes.xs,
    color: '#78350F',
    lineHeight: 16,
  },
  provenanceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderMuted,
  },
  provenanceToggleText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.primaryDark,
  },
  sourceShort: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  technicalBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  techRow: {
    flexDirection: 'column',
    marginBottom: 2,
  },
  techLabel: {
    fontSize: 10,
    fontWeight: fontWeights.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  techMono: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
});
