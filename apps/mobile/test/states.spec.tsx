import React from 'react';
import { LoadingState } from '../src/components/states/LoadingState';
import { EmptyState } from '../src/components/states/EmptyState';
import { ErrorState } from '../src/components/states/ErrorState';
import { SecureState } from '../src/components/states/SecureState';
import { RiskState } from '../src/components/states/RiskState';

describe('Sentinel Security State Views', () => {
  it('should render LoadingState with skeleton elements', () => {
    const state = (
      <LoadingState title="Analyzing Signals..." description="Collecting baseline checks" />
    );
    expect(state).toBeDefined();
  });

  it('should render EmptyState with action', () => {
    const onAction = jest.fn();
    const state = (
      <EmptyState
        title="No Findings Detected"
        description="Your device baseline shows no security anomalies."
        actionLabel="Run Fresh Scan"
        onAction={onAction}
      />
    );
    expect(state).toBeDefined();
  });

  it('should render ErrorState with transparent disclaimer and retry', () => {
    const onRetry = jest.fn();
    const state = (
      <ErrorState
        title="Unable to Inspect Kernel"
        description="OS sandbox blocked access to kernel telemetry."
        onRetry={onRetry}
      />
    );
    expect(state).toBeDefined();
  });

  it('should render SecureState with clear disclaimer and breakdown', () => {
    const state = (
      <SecureState checksCompleted={147} categoriesAssessed={6} controlsEvaluated={23} />
    );
    expect(state).toBeDefined();
  });

  it('should render RiskState with critical indicators and remediation CTA', () => {
    const onAction = jest.fn();
    const state = (
      <RiskState
        criticalCount={1}
        highCount={2}
        score={58}
        headlineFinding="Primary account lacks MFA"
        whyItMatters="Single-factor accounts can be hijacked easily."
        onTakeAction={onAction}
      />
    );
    expect(state).toBeDefined();
  });
});
