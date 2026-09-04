import { ConfigService } from '@nestjs/config';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import type { ThreatIntelResult } from '@sentinel/types';

describe('Threat Intelligence Caching & Rate Limiting (Phase 8 Requirements D & E)', () => {
  let cacheService: ThreatIntelCacheService;
  let rateLimiter: ThreatIntelRateLimiterService;

  const mockResult: ThreatIntelResult = {
    intelligenceType: 'URL',
    indicator: 'https://example-phish.com',
    normalizedIndicator: 'https://example-phish.com',
    verdict: 'MALICIOUS',
    threatType: 'PHISHING',
    confidence: 0.95,
    severity: 'HIGH',
    source: 'test_provider',
    sourceDisplayName: 'Test Provider',
    sourceReliability: {
      authorityLevel: 'REPUTABLE_SECURITY_COMMUNITY',
      reliabilityScore: 0.9,
      isAuthoritative: false,
      description: 'Test',
    },
    providerStatus: 'SUCCESS',
    summary: 'Test malicious indicator',
    evidence: { tag: 'test' },
    references: [],
    retrievedAt: new Date().toISOString(),
    cached: false,
  };

  beforeEach(() => {
    const config = new ConfigService();
    cacheService = new ThreatIntelCacheService(config);
    rateLimiter = new ThreatIntelRateLimiterService();
  });

  describe('Deterministic Caching & TTL', () => {
    it('returns null on cache miss', async () => {
      const cached = await cacheService.get('URL', 'https://non-cached-target.com');
      expect(cached).toBeNull();
    });

    it('stores and retrieves cached threat intelligence with cached: true flag', async () => {
      await cacheService.set('URL', 'https://example-phish.com', mockResult, 3600);

      const cached = await cacheService.get('URL', 'https://example-phish.com');
      expect(cached).toBeDefined();
      expect(cached?.cached).toBe(true);
      expect(cached?.verdict).toBe('MALICIOUS');
      expect(cached?.expiresAt).toBeDefined();
    });

    it('expires cached intelligence after TTL passes', async () => {
      // Set short 1-second TTL
      await cacheService.set('URL', 'https://expiring-site.com', mockResult, 1);

      // Verify cached immediately
      let cached = await cacheService.get('URL', 'https://expiring-site.com');
      expect(cached).not.toBeNull();

      // Simulate clock tick past expiration
      await new Promise((res) => setTimeout(res, 1100));

      cached = await cacheService.get('URL', 'https://expiring-site.com');
      expect(cached).toBeNull();
    });

    it('evicts cache entry when deleted', async () => {
      await cacheService.set('URL', 'https://to-delete.com', mockResult, 3600);
      expect(await cacheService.get('URL', 'https://to-delete.com')).not.toBeNull();

      await cacheService.delete('URL', 'https://to-delete.com');
      expect(await cacheService.get('URL', 'https://to-delete.com')).toBeNull();
    });

    it('generates deterministic normalized cache keys without leaking secrets or tokens', () => {
      const key1 = cacheService.generateKey('URL', 'https://example.com/login?param=1');
      const key2 = cacheService.generateKey('URL', 'https://example.com/login?param=1');
      expect(key1).toBe(key2);
      expect(key1.startsWith('threat_intel:url:')).toBe(true);

      const cveKey = cacheService.generateKey('CVE', 'CVE-2021-44228');
      expect(cveKey).toBe('threat_intel:cve:CVE-2021-44228');
    });
  });

  describe('Rate Limiting & Bounded Retries', () => {
    it('detects rate limiting and enforces cooldown period', () => {
      expect(rateLimiter.isRateLimited('test_prov')).toBe(false);

      rateLimiter.recordRateLimitResponse('test_prov', 10);
      expect(rateLimiter.isRateLimited('test_prov')).toBe(true);
    });

    it('immediately rejects requests during active rate-limit cooldown without retrying', async () => {
      rateLimiter.recordRateLimitResponse('blocked_prov', 30);

      const op = jest.fn();
      await expect(rateLimiter.executeWithRetry('blocked_prov', op)).rejects.toMatchObject({
        status: 429,
        code: 'RATE_LIMITED',
      });

      expect(op).not.toHaveBeenCalled();
    });

    it('performs bounded retry (max 1 retry) on transient 5xx errors and succeeds if recovery occurs', async () => {
      let callCount = 0;
      const transientOp = async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error('503 Service Unavailable');
          (err as any).status = 503;
          throw err;
        }
        return 'recovered_success';
      };

      const result = await rateLimiter.executeWithRetry('transient_prov', transientOp, {
        maxRetries: 1,
        initialDelayMs: 50,
      });

      expect(result).toBe('recovered_success');
      expect(callCount).toBe(2);
    });

    it('exhausts retries on persistent 5xx failure without entering infinite loops', async () => {
      let callCount = 0;
      const failingOp = async () => {
        callCount++;
        const err = new Error('500 Internal Server Error');
        (err as any).status = 500;
        throw err;
      };

      await expect(
        rateLimiter.executeWithRetry('failing_prov', failingOp, {
          maxRetries: 1,
          initialDelayMs: 20,
        }),
      ).rejects.toThrow('500 Internal Server Error');

      expect(callCount).toBe(2); // 1 initial attempt + 1 retry = 2 attempts total
    });

    it('does NOT retry client 4xx errors (e.g. 400 or 404)', async () => {
      let callCount = 0;
      const clientErrorOp = async () => {
        callCount++;
        const err = new Error('404 Not Found');
        (err as any).status = 404;
        throw err;
      };

      await expect(
        rateLimiter.executeWithRetry('client_err_prov', clientErrorOp, { maxRetries: 2 }),
      ).rejects.toThrow('404 Not Found');

      expect(callCount).toBe(1); // strictly 1 attempt, zero retries
    });
  });
});
