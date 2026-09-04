import { Injectable, Logger } from '@nestjs/common';
import type {
  ThreatIntelResult,
  ThreatIntelType,
  SourceReliability,
  ThreatProviderDescriptor,
} from '@sentinel/types';
import type {
  ThreatIntelProvider,
  ProviderQueryOptions,
} from '../interfaces/threat-intel-provider.interface';
import { CisaKevProvider } from './cisa-kev.provider';
import { UrlhausProvider } from './urlhaus.provider';

@Injectable()
export class ExposureProvider implements ThreatIntelProvider {
  readonly id = 'exposure';
  readonly name = 'exposure';
  readonly displayName = 'Sentinel Defensive Exposure Intelligence';
  readonly supportedTypes: ThreatIntelType[] = ['EXPOSURE'];
  readonly attribution =
    'Synthesized from authorized defensive feeds (CISA KEV, abuse.ch) strictly adhering to non-intrusive safety principles';
  readonly termsUrl = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';

  readonly reliability: SourceReliability = {
    authorityLevel: 'AUTHORITATIVE_GOVERNMENT',
    reliabilityScore: 0.95,
    isAuthoritative: true,
    description:
      'Defensive exposure intelligence evaluating known exploitation exposure and active threat campaigns without intrusive probing.',
  };

  private readonly logger = new Logger(ExposureProvider.name);

  constructor(
    private readonly cisaKevProvider: CisaKevProvider,
    private readonly urlhausProvider: UrlhausProvider,
  ) {}

  isConfigured(): boolean {
    return true;
  }

  getDescriptor(): ThreatProviderDescriptor {
    return {
      id: this.id,
      name: this.displayName,
      supportedTypes: this.supportedTypes,
      reliability: this.reliability,
      isConfigured: this.isConfigured(),
      isHealthy: true,
      attribution: this.attribution,
      termsUrl: this.termsUrl,
    };
  }

  async query(
    normalizedIndicator: string,
    type: ThreatIntelType,
    options?: ProviderQueryOptions,
  ): Promise<ThreatIntelResult> {
    const indicator = normalizedIndicator.trim();
    const retrievedAt = new Date().toISOString();

    // 1. If indicator is a CVE, evaluate known exploitation and ransomware exposure via CISA KEV
    if (/^CVE-\d{4}-\d{4,8}$/i.test(indicator)) {
      const cveResult = await this.cisaKevProvider.query(indicator, 'CVE', options);

      if (cveResult.verdict === 'MALICIOUS') {
        const isRansomware =
          cveResult.evidence.knownRansomwareCampaignUse &&
          cveResult.evidence.knownRansomwareCampaignUse !== 'Unknown';

        return {
          intelligenceType: 'EXPOSURE',
          indicator: options?.originalIndicator || indicator,
          normalizedIndicator: indicator,
          verdict: 'MALICIOUS',
          threatType: isRansomware ? 'RANSOMWARE' : 'EXPLOITED_VULNERABILITY',
          confidence: 1.0,
          severity: 'CRITICAL',
          source: this.id,
          sourceDisplayName: this.displayName,
          sourceReliability: this.reliability,
          providerStatus: 'SUCCESS',
          summary: `High exposure: ${indicator} has confirmed active wild exploitation${isRansomware ? ' and ransomware campaign involvement' : ''}.`,
          details: `Vendor: ${cveResult.evidence.vendorProject} (${cveResult.evidence.product}). CISA BOD Remediation Due Date: ${cveResult.evidence.dueDate || 'Immediate'}. Action: ${cveResult.evidence.requiredAction || 'Apply security updates immediately.'}`,
          evidence: {
            exposureType: 'KNOWN_EXPLOITED_VULNERABILITY',
            ransomwareUse: cveResult.evidence.knownRansomwareCampaignUse,
            vendorProject: cveResult.evidence.vendorProject,
            product: cveResult.evidence.product,
            dueDate: cveResult.evidence.dueDate,
          },
          references: cveResult.references,
          retrievedAt,
          cached: false,
        };
      }

      return {
        intelligenceType: 'EXPOSURE',
        indicator: options?.originalIndicator || indicator,
        normalizedIndicator: indicator,
        verdict: 'CLEAN',
        threatType: 'NONE',
        confidence: 0.9,
        severity: 'INFO',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: 'SUCCESS',
        summary: `No active weaponized exposure cataloged in CISA KEV for ${indicator}.`,
        details:
          'The vulnerability is not listed as actively exploited by known threat actors in the CISA KEV catalog.',
        evidence: {
          exposureType: 'VULNERABILITY_ASSESSMENT',
          activelyExploited: false,
        },
        references: cveResult.references,
        retrievedAt,
        cached: false,
      };
    }

    // 2. If indicator is a domain/URL, check exposure in verified malware distribution endpoints
    const isUrl = indicator.startsWith('http://') || indicator.startsWith('https://');
    const lookupType = isUrl ? 'URL' : 'DOMAIN';
    const domainResult = await this.urlhausProvider.query(indicator, lookupType, options);

    if (domainResult.verdict === 'MALICIOUS') {
      return {
        intelligenceType: 'EXPOSURE',
        indicator: options?.originalIndicator || indicator,
        normalizedIndicator: indicator,
        verdict: 'MALICIOUS',
        threatType: 'DATA_EXPOSURE',
        confidence: 0.95,
        severity: 'HIGH',
        source: this.id,
        sourceDisplayName: this.displayName,
        sourceReliability: this.reliability,
        providerStatus: 'SUCCESS',
        summary: `Exposure alert: ${indicator} is actively associated with external malicious infrastructure.`,
        details:
          'Interacting with this domain exposes devices or credentials to known malware campaigns.',
        evidence: {
          exposureType: 'MALICIOUS_INFRASTRUCTURE_EXPOSURE',
          ...domainResult.evidence,
        },
        references: domainResult.references,
        retrievedAt,
        cached: false,
      };
    }

    return {
      intelligenceType: 'EXPOSURE',
      indicator: options?.originalIndicator || indicator,
      normalizedIndicator: indicator,
      verdict: 'UNKNOWN',
      threatType: 'NONE',
      confidence: 0.85,
      severity: 'LOW',
      source: this.id,
      sourceDisplayName: this.displayName,
      sourceReliability: this.reliability,
      providerStatus: 'SUCCESS',
      summary: `No public malicious infrastructure exposure detected for ${indicator}.`,
      details:
        'Defensive external feeds show no active associations with malware campaigns or weaponized threats.',
      evidence: {
        exposureType: 'DEFENSIVE_CHECK',
        exposed: false,
      },
      references: domainResult.references,
      retrievedAt,
      cached: false,
    };
  }
}
