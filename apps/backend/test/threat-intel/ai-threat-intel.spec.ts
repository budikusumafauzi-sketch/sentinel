import { ConfigService } from '@nestjs/config';
import { AiService } from '../../src/ai/ai.service';
import { PromptRegistry } from '../../src/ai/prompts/prompt-registry';
import { OutputValidator } from '../../src/ai/validation/output-validator';
import { MockAiProvider } from '../../src/ai/providers/mock.provider';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import { CisaKevProvider } from '../../src/threat-intel/providers/cisa-kev.provider';
import { OsvProvider } from '../../src/threat-intel/providers/osv.provider';
import { UrlhausProvider } from '../../src/threat-intel/providers/urlhaus.provider';
import { OpenPhishProvider } from '../../src/threat-intel/providers/openphish.provider';
import { ExposureProvider } from '../../src/threat-intel/providers/exposure.provider';

describe('AI and Threat Intelligence Boundary Enforcement (Phase 8 Requirement I)', () => {
  let aiService: AiService;
  let threatIntelService: ThreatIntelService;
  let mockAiProvider: MockAiProvider;
  let openphish: OpenPhishProvider;

  beforeEach(() => {
    const config = new ConfigService();
    const cacheService = new ThreatIntelCacheService(config);
    const rateLimiter = new ThreatIntelRateLimiterService();
    const cisaKev = new CisaKevProvider(config, rateLimiter);
    const osv = new OsvProvider(config, rateLimiter);
    const urlhaus = new UrlhausProvider(config, rateLimiter);
    openphish = new OpenPhishProvider(config, rateLimiter);
    const exposure = new ExposureProvider(cisaKev, urlhaus);

    threatIntelService = new ThreatIntelService(
      config,
      cacheService,
      rateLimiter,
      cisaKev,
      osv,
      urlhaus,
      openphish,
      exposure,
    );

    mockAiProvider = new MockAiProvider();
    const promptRegistry = new PromptRegistry();
    const outputValidator = new OutputValidator();

    aiService = new AiService(
      {} as any, // prisma not needed for analyzeUrl
      promptRegistry,
      outputValidator,
      mockAiProvider,
      threatIntelService,
    );
    openphish.seedMockData([]);
    urlhaus.seedMockData([]);
  });

  it('incorporates authoritative external threat intelligence into AI analysis context and preserves source attribution', async () => {
    // Seed verified phishing site
    openphish.seedMockData(['https://verified-phish-portal.org/login']);

    const result = await aiService.analyzeUrl('user-1', {
      url: 'https://verified-phish-portal.org/login',
    });

    expect(result).toBeDefined();
    // Attribution must acknowledge verified provider and not claim Sentinel AI created the ground truth
    expect(result.sourceAttribution).toContain('OpenPhish');
    expect(result.riskLevel).toBe('HIGH');
    expect(result.provenance.deterministicEngineAuthoritative).toBe(true);
    expect(result.provenance.aiInterpretationOnly).toBe(true);
  });

  it('proves AI cannot downgrade a verified MALICIOUS threat intelligence verdict to LOW risk', async () => {
    openphish.seedMockData(['https://dangerous-malware-link.biz/download']);

    // Set mock AI to attempt returning LOW risk
    mockAiProvider.setMockHandler(async () => ({
      observations: ['Looks okay to AI model'],
      riskInterpretation: 'Model thought this was low risk',
      riskLevel: 'LOW',
      confidence: 0.9,
      limitations: ['None'],
      sourceAttribution: 'Hallucinated Model Output',
    }));

    const result = await aiService.analyzeUrl('user-1', {
      url: 'https://dangerous-malware-link.biz/download',
    });

    // Guardrail in AiService must enforce that external verified malicious intelligence overrides model downgrade
    expect(result.riskLevel).toBe('HIGH');
    expect(result.sourceAttribution).toContain('OpenPhish');
  });

  it('preserves underlying structured threat intelligence even if AI fails or times out', async () => {
    openphish.seedMockData(['https://confirmed-active-phish.com/target']);

    // Directly query authoritative ThreatIntelService
    const authoritativeResult = await threatIntelService.queryUrl(
      'https://confirmed-active-phish.com/target',
    );
    expect(authoritativeResult.verdict).toBe('MALICIOUS');
    expect(authoritativeResult.source).toBe('openphish');

    // Simulate complete AI failure
    mockAiProvider.setMockHandler(async () => {
      throw new Error('AI Service 503 Unavailable');
    });

    await expect(
      aiService.analyzeUrl('user-1', { url: 'https://confirmed-active-phish.com/target' }),
    ).rejects.toThrow();

    // The authoritative threat intelligence remains completely unaffected and intact in the cache/service!
    const retrievedAgain = await threatIntelService.queryUrl(
      'https://confirmed-active-phish.com/target',
    );
    expect(retrievedAgain.verdict).toBe('MALICIOUS');
    expect(retrievedAgain.sourceDisplayName).toContain('OpenPhish');
  });
});
