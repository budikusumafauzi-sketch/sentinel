import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThreatIntelService } from '../../src/threat-intel/threat-intel.service';
import { ThreatIntelCacheService } from '../../src/threat-intel/cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from '../../src/threat-intel/rate-limiting/threat-intel-rate-limiter.service';
import { ThreatIntelValidator } from '../../src/threat-intel/validation/ssrf-validator';
import { CisaKevProvider } from '../../src/threat-intel/providers/cisa-kev.provider';
import { OsvProvider } from '../../src/threat-intel/providers/osv.provider';
import { UrlhausProvider } from '../../src/threat-intel/providers/urlhaus.provider';
import { OpenPhishProvider } from '../../src/threat-intel/providers/openphish.provider';
import { ExposureProvider } from '../../src/threat-intel/providers/exposure.provider';

describe('URL and Domain Intelligence & SSRF Protection (Phase 8 Requirement B)', () => {
  let service: ThreatIntelService;
  let urlhaus: UrlhausProvider;
  let openphish: OpenPhishProvider;

  beforeEach(() => {
    const config = new ConfigService();
    const cacheService = new ThreatIntelCacheService(config);
    const rateLimiter = new ThreatIntelRateLimiterService();
    const cisaKev = new CisaKevProvider(config, rateLimiter);
    const osv = new OsvProvider(config, rateLimiter);
    urlhaus = new UrlhausProvider(config, rateLimiter);
    openphish = new OpenPhishProvider(config, rateLimiter);
    const exposure = new ExposureProvider(cisaKev, urlhaus);

    service = new ThreatIntelService(
      config,
      cacheService,
      rateLimiter,
      cisaKev,
      osv,
      urlhaus,
      openphish,
      exposure,
    );

    urlhaus.seedMockData([], []);
    openphish.seedMockData([], []);
  });

  describe('SSRF Protection & Sanitization', () => {
    it('rejects loopback and localhost targets', () => {
      expect(() => ThreatIntelValidator.normalizeUrl('http://localhost/admin')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('http://127.0.0.1:8080/secret')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('http://[::1]/')).toThrow(BadRequestException);
      expect(() => ThreatIntelValidator.normalizeDomain('localhost')).toThrow(BadRequestException);
      expect(() => ThreatIntelValidator.normalizeDomain('127.0.0.1')).toThrow(BadRequestException);
    });

    it('rejects private IPv4 networks (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)', () => {
      expect(() => ThreatIntelValidator.normalizeUrl('http://10.0.0.1/')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('http://172.16.5.10/status')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('http://192.168.1.1/setup')).toThrow(
        BadRequestException,
      );
      expect(() =>
        ThreatIntelValidator.normalizeUrl('http://169.254.169.254/latest/meta-data'),
      ).toThrow(BadRequestException);
    });

    it('rejects internal and reserved domain suffixes (.local, .internal, .lan, .corp)', () => {
      expect(() => ThreatIntelValidator.normalizeUrl('https://router.local/config')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('https://vault.internal/api')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('https://service.lan')).toThrow(
        BadRequestException,
      );
    });

    it('strips user credentials, passwords, and sensitive query tokens before normalization', () => {
      const result = ThreatIntelValidator.normalizeUrl(
        'https://admin:supersecret@suspicious-bank-login.com/login?token=abc123secret&ref=user#anchorHash',
      );

      expect(result.normalizedUrl).not.toContain('admin:supersecret');
      expect(result.normalizedUrl).not.toContain('token=abc123secret');
      expect(result.normalizedUrl).not.toContain('#anchorHash');
      expect(result.normalizedUrl).toContain('ref=user');
      expect(result.hostname).toBe('suspicious-bank-login.com');
      expect(result.isSafeForExternalQuery).toBe(true);
    });

    it('rejects non-HTTP/HTTPS protocols', () => {
      expect(() => ThreatIntelValidator.normalizeUrl('file:///etc/passwd')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('ftp://example.com')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('javascript:alert(1)')).toThrow(
        BadRequestException,
      );
      expect(() => ThreatIntelValidator.normalizeUrl('gopher://example.com')).toThrow(
        BadRequestException,
      );
    });

    it('rejects malformed URLs safely', () => {
      expect(() => ThreatIntelValidator.normalizeUrl('')).toThrow(BadRequestException);
      expect(() => ThreatIntelValidator.normalizeUrl('not-a-url')).toThrow(BadRequestException);
    });
  });

  describe('URL Intelligence Queries', () => {
    it('detects verified phishing URLs from OpenPhish feed', async () => {
      openphish.seedMockData(['https://apple-id-verify-alert.xyz/login']);

      const result = await service.queryUrl('https://apple-id-verify-alert.xyz/login', true);

      expect(result.verdict).toBe('MALICIOUS');
      expect(result.threatType).toBe('PHISHING');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.severity).toBe('CRITICAL');
      expect(result.sourceDisplayName).toContain('OpenPhish');
    });

    it('detects malware distribution endpoints from URLhaus feed', async () => {
      urlhaus.seedMockData(['https://malware-drop-site.ru/payload.exe']);

      const result = await service.queryUrl('https://malware-drop-site.ru/payload.exe', true);

      expect(result.verdict).toBe('MALICIOUS');
      expect(result.threatType).toBe('MALWARE');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.severity).toBe('CRITICAL');
      expect(result.sourceDisplayName).toContain('URLhaus');
    });

    it('correlates multi-source malicious intelligence when flagged by both feeds', async () => {
      const target = 'https://compromised-shared-threat.com/malicious';
      openphish.seedMockData([target]);
      urlhaus.seedMockData([target]);

      const result = await service.queryUrl(target, true);

      expect(result.verdict).toBe('MALICIOUS');
      expect(result.evidence.verifiedByMultipleSources).toBe(true);
      expect(result.references.length).toBeGreaterThanOrEqual(2);
    });

    it('returns UNKNOWN with clear documentation when not present in active malicious feeds', async () => {
      openphish.seedMockData([]);
      urlhaus.seedMockData([]);

      const result = await service.queryUrl('https://legitimate-secure-service.org', true);

      expect(result.verdict).toBe('UNKNOWN');
      expect(result.threatType).toBe('NONE');
      expect(result.summary).toContain('Not observed');
      expect(result.details).toMatch(/No verified active phishing|No active malware/);
    });
  });

  describe('Domain Intelligence Queries', () => {
    it('detects malicious domain hosts from URLhaus', async () => {
      urlhaus.seedMockData([], ['phishing-hub.org']);

      const result = await service.queryDomain('phishing-hub.org', true);

      expect(result.verdict).toBe('MALICIOUS');
      expect(result.threatType).toBe('MALWARE');
      expect(result.normalizedIndicator).toBe('phishing-hub.org');
    });

    it('normalizes domain names by stripping protocol, paths, and ports', async () => {
      urlhaus.seedMockData([], ['clean-site.com']);

      const norm = ThreatIntelValidator.normalizeDomain(
        'https://clean-site.com:8443/some/path?param=1',
      );
      expect(norm.normalizedDomain).toBe('clean-site.com');
    });
  });
});
