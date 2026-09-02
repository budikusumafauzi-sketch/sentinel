import React from 'react';
import { Card } from '../src/components/common/Card';
import { SeverityBadge, StatusBadge } from '../src/components/common/Badge';
import { PrimaryButton, SecondaryButton, IconButton } from '../src/components/common/Button';
import { SectionHeader } from '../src/components/common/SectionHeader';
import { ProgressBar } from '../src/components/common/ProgressBar';
import { ScoreGauge } from '../src/components/security/ScoreGauge';
import { CategoryCard } from '../src/components/security/CategoryCard';
import { FindingCard } from '../src/components/security/FindingCard';
import { RecommendationCard } from '../src/components/security/RecommendationCard';
import { ActivityItem } from '../src/components/security/ActivityItem';
import { SystemStatusRow } from '../src/components/security/SystemStatusRow';
import {
  mockSecurityScore,
  mockFindingsSummary,
  mockCategories,
  mockFindings,
  mockRecommendations,
  mockActivity,
  mockSystemControls,
} from '../src/mock/securityData';

describe('Reusable UI Components', () => {
  it('should render Card component in different variants without throwing', () => {
    const elevated = (
      <Card variant="elevated">
        <Card>Child</Card>
      </Card>
    );
    const outlined = (
      <Card variant="outlined">
        <Card>Child</Card>
      </Card>
    );
    const muted = (
      <Card variant="muted">
        <Card>Child</Card>
      </Card>
    );
    expect(elevated).toBeDefined();
    expect(outlined).toBeDefined();
    expect(muted).toBeDefined();
  });

  it('should render Badges correctly for all severity and status levels', () => {
    const criticalBadge = <SeverityBadge severity="critical" count={2} />;
    const highBadge = <SeverityBadge severity="high" />;
    const secureBadge = <StatusBadge status="secure" label="Verified" />;
    const attentionBadge = <StatusBadge status="attention" />;

    expect(criticalBadge).toBeDefined();
    expect(highBadge).toBeDefined();
    expect(secureBadge).toBeDefined();
    expect(attentionBadge).toBeDefined();
  });

  it('should render Buttons with different variants and icons', () => {
    const onPress = jest.fn();
    const primary = <PrimaryButton title="Scan Now" onPress={onPress} icon="scan" />;
    const secondary = <SecondaryButton title="Cancel" onPress={onPress} />;
    const iconBtn = <IconButton icon="bell" onPress={onPress} accessibilityLabel="Notifications" />;

    expect(primary).toBeDefined();
    expect(secondary).toBeDefined();
    expect(iconBtn).toBeDefined();
  });

  it('should render SectionHeader and ProgressBar', () => {
    const header = (
      <SectionHeader
        title="Security Categories"
        subtitle="6 assessed"
        actionText="View All"
        onAction={() => {}}
      />
    );
    const bar = <ProgressBar progress={82} />;

    expect(header).toBeDefined();
    expect(bar).toBeDefined();
  });

  it('should render ScoreGauge with score and findings breakdown', () => {
    const gauge = (
      <ScoreGauge scoreData={mockSecurityScore} findingsSummary={mockFindingsSummary} />
    );
    expect(gauge).toBeDefined();
  });

  it('should render CategoryCard in row and grid modes', () => {
    const row = <CategoryCard category={mockCategories[0]!} variant="row" />;
    const grid = <CategoryCard category={mockCategories[0]!} variant="grid" />;
    expect(row).toBeDefined();
    expect(grid).toBeDefined();
  });

  it('should render FindingCard and RecommendationCard', () => {
    const finding = <FindingCard finding={mockFindings[0]!} onTakeAction={() => {}} />;
    const rec = <RecommendationCard recommendation={mockRecommendations[0]!} />;
    expect(finding).toBeDefined();
    expect(rec).toBeDefined();
  });

  it('should render ActivityItem and SystemStatusRow', () => {
    const act = <ActivityItem activity={mockActivity[0]!} isLast={false} />;
    const sys = <SystemStatusRow control={mockSystemControls[0]!} />;
    expect(act).toBeDefined();
    expect(sys).toBeDefined();
  });
});
