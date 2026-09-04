jest.mock('../../src/auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class MockJwtAuthGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ThreatIntelController } from '../../src/threat-intel/threat-intel.controller';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import type { ThreatIntelResult, ThreatProviderDescriptor } from '@sentinel/types';

describe('ThreatIntelController API Endpoints', () => {
  let controller: ThreatIntelController;
  let service: ThreatIntelService;

  const mockIntelResult: ThreatIntelResult = {
    intelligenceType: 'URL',
    indicator: 'https://test-example.com',
    normalizedIndicator: 'https://test-example.com',
    verdict: 'CLEAN',
    threatType: 'NONE',
    confidence: 0.9,
    severity: 'LOW',
    source: 'test_provider',
    sourceDisplayName: 'Test Provider',
    sourceReliability: {
      authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
      reliabilityScore: 0.9,
      isAuthoritative: false,
      description: 'Test',
    },
    providerStatus: 'SUCCESS',
    summary: 'No active threats detected',
    evidence: {},
    references: [],
    retrievedAt: new Date().toISOString(),
    cached: false,
  };

  const mockDescriptors: ThreatProviderDescriptor[] = [
    {
      id: 'cisa_kev',
      name: 'CISA KEV',
      supportedTypes: ['CVE', 'EXPOSURE'],
      reliability: {
        authorityLevel: 'AUTHORITATIVE_GOVERNMENT',
        reliabilityScore: 0.98,
        isAuthoritative: true,
        description: 'Official US Government feed',
      },
      isConfigured: true,
      isHealthy: true,
      attribution: 'CISA',
    },
  ];

  beforeEach(async () => {
    const mockService = {
      queryIndicator: jest.fn().mockResolvedValue(mockIntelResult),
      queryUrl: jest.fn().mockResolvedValue(mockIntelResult),
      queryDomain: jest.fn().mockResolvedValue(mockIntelResult),
      queryCve: jest.fn().mockResolvedValue({ ...mockIntelResult, intelligenceType: 'CVE' }),
      queryExposure: jest
        .fn()
        .mockResolvedValue({ ...mockIntelResult, intelligenceType: 'EXPOSURE' }),
      getProviders: jest.fn().mockReturnValue(mockDescriptors),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreatIntelController],
      providers: [
        {
          provide: ThreatIntelService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ThreatIntelController>(ThreatIntelController);
    service = module.get<ThreatIntelService>(ThreatIntelService);
  });

  it('should query generic indicator and wrap in ApiResponse envelope', async () => {
    const response = await controller.queryIndicator({
      type: 'URL',
      indicator: 'https://test-example.com',
    });

    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockIntelResult);
    expect(response.timestamp).toBeDefined();
    expect(service.queryIndicator).toHaveBeenCalledWith(
      'URL',
      'https://test-example.com',
      undefined,
    );
  });

  it('should query URL and wrap in ApiResponse envelope', async () => {
    const response = await controller.queryUrl({
      url: 'https://test-example.com',
      forceRefresh: true,
    });

    expect(response.success).toBe(true);
    expect(response.data.intelligenceType).toBe('URL');
    expect(service.queryUrl).toHaveBeenCalledWith('https://test-example.com', true);
  });

  it('should query Domain and wrap in ApiResponse envelope', async () => {
    const response = await controller.queryDomain({ domain: 'test-example.com' });

    expect(response.success).toBe(true);
    expect(service.queryDomain).toHaveBeenCalledWith('test-example.com', undefined);
  });

  it('should query CVE and wrap in ApiResponse envelope', async () => {
    const response = await controller.queryCve({ cveId: 'CVE-2021-44228' });

    expect(response.success).toBe(true);
    expect(response.data.intelligenceType).toBe('CVE');
    expect(service.queryCve).toHaveBeenCalledWith('CVE-2021-44228', undefined);
  });

  it('should query Exposure and wrap in ApiResponse envelope', async () => {
    const response = await controller.queryExposure({
      indicator: 'CVE-2021-44228',
      indicatorType: 'CVE',
    });

    expect(response.success).toBe(true);
    expect(response.data.intelligenceType).toBe('EXPOSURE');
    expect(service.queryExposure).toHaveBeenCalledWith('CVE-2021-44228', 'CVE', undefined);
  });

  it('should list all registered provider descriptors', async () => {
    const response = await controller.getProviders();

    expect(response.success).toBe(true);
    expect(response.data).toEqual(mockDescriptors);
    expect(response.data.length).toBe(1);
    expect(response.data[0].id).toBe('cisa_kev');
  });
});
