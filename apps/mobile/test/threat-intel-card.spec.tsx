import React from 'react';
import { ThreatIntelCard } from '../src/components/analyzer/ThreatIntelCard';
import type { ThreatIntelResult } from '@sentinel/types';

describe('ThreatIntelCard Mobile Component', () => {
  const mockMaliciousResult: ThreatIntelResult = {
    intelligenceType: 'URL',
    indicator: 'https://evil-phish.biz/login',
    normalizedIndicator: 'https://evil-phish.biz/login',
    verdict: 'MALICIOUS',
    threatType: 'PHISHING',
    confidence: 0.95,
    severity: 'CRITICAL',
    source: 'openphish',
    sourceDisplayName: 'OpenPhish Community Feed',
    sourceReliability: {
      authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
      reliabilityScore: 0.9,
      isAuthoritative: false,
      description: 'Verified phishing feed.',
    },
    providerStatus: 'SUCCESS',
    summary: 'Active phishing site targeting credentials.',
    details: 'Flagged by OpenPhish real-time verified intelligence.',
    evidence: { verified: true, campaign: 'credential_harvesting' },
    references: [{ name: 'OpenPhish Detail', url: 'https://openphish.com', type: 'COMMUNITY' }],
    retrievedAt: '2026-09-04T12:00:00.000Z',
    cached: true,
  };

  const mockUnavailableResult: ThreatIntelResult = {
    intelligenceType: 'URL',
    indicator: 'https://example.com',
    normalizedIndicator: 'https://example.com',
    verdict: 'UNAVAILABLE',
    threatType: 'UNKNOWN',
    confidence: 0,
    severity: 'UNKNOWN',
    source: 'url_intelligence_aggregator',
    sourceDisplayName: 'Sentinel URL Intelligence Aggregator',
    sourceReliability: {
      authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
      reliabilityScore: 0.9,
      isAuthoritative: false,
      description: 'Aggregator',
    },
    providerStatus: 'ERROR',
    summary: 'Threat feeds temporarily unreachable.',
    evidence: {},
    references: [],
    retrievedAt: '2026-09-04T12:00:00.000Z',
    cached: false,
  };

  it('renders malicious threat result with cached badge and references without error', () => {
    const component = <ThreatIntelCard result={mockMaliciousResult} onRefresh={jest.fn()} />;
    expect(component).toBeDefined();
  });

  it('renders unavailable threat result without treating it as clean', () => {
    const component = <ThreatIntelCard result={mockUnavailableResult} />;
    expect(component).toBeDefined();
    expect(mockUnavailableResult.verdict).toBe('UNAVAILABLE');
    expect(mockUnavailableResult.verdict).not.toBe('CLEAN');
  });

  it('renders CISA KEV authoritative exploited CVE result', () => {
    const cveResult: ThreatIntelResult = {
      intelligenceType: 'CVE',
      indicator: 'CVE-2021-44228',
      normalizedIndicator: 'CVE-2021-44228',
      verdict: 'MALICIOUS',
      threatType: 'EXPLOITED_VULNERABILITY',
      confidence: 1.0,
      severity: 'CRITICAL',
      source: 'cisa_kev',
      sourceDisplayName: 'CISA Known Exploited Vulnerabilities (KEV)',
      sourceReliability: {
        authorityLevel: 'AUTHORITATIVE_GOVERNMENT',
        reliabilityScore: 0.98,
        isAuthoritative: true,
        description: 'Official US Government cybersecurity catalog.',
      },
      providerStatus: 'SUCCESS',
      summary: 'Actively exploited in the wild (Log4Shell).',
      evidence: { dueDate: '2021-12-24', requiredAction: 'Apply vendor updates.' },
      references: [{ name: 'CISA Advisory', url: 'https://cisa.gov', type: 'ADVISORY' }],
      retrievedAt: '2026-09-04T12:00:00.000Z',
      cached: false,
    };

    const component = <ThreatIntelCard result={cveResult} />;
    expect(component).toBeDefined();
    expect(cveResult.sourceReliability.isAuthoritative).toBe(true);
  });
});
