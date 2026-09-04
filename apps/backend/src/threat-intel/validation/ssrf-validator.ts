import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * SSRF Protection & Indicator Normalization Utility.
 *
 * Enforces defensive cybersecurity principles:
 * - Rejects private / loopback / link-local / internal IP addresses.
 * - Rejects non-routable, internal, or reserved domain names.
 * - Enforces only standard HTTP/HTTPS protocols for URLs.
 * - Strips sensitive credentials, userinfo, and auth query parameters.
 * - Strips URL fragments (#hash) to protect privacy.
 * - Normalizes CVE IDs to standard uppercase format.
 */

// Private & reserved IPv4 ranges
const PRIVATE_IPV4_PATTERNS = [
  /^127\./, // Loopback (127.0.0.0/8)
  /^10\./, // Private class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B (172.16.0.0/12)
  /^192\.168\./, // Private class C (192.168.0.0/16)
  /^169\.254\./, // Link-local (169.254.0.0/16)
  /^0\./, // Current network (0.0.0.0/8)
  /^224\./, // Multicast (224.0.0.0/4)
  /^240\./, // Reserved (240.0.0.0/4)
];

// Reserved & internal TLDs / hostnames
const RESERVED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'local',
  'internal',
  'lan',
  'home',
  'corp',
  'intranet',
  'onion',
  'i2p',
]);

const RESERVED_TLD_SUFFIXES = [
  '.local',
  '.internal',
  '.lan',
  '.home',
  '.corp',
  '.arpa',
  '.test',
  '.example',
  '.invalid',
  '.localhost',
];

// Sensitive query parameters stripped before transmission to external threat intel
const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'auth',
  'access_token',
  'api_key',
  'apikey',
  'key',
  'secret',
  'password',
  'pass',
  'pwd',
  'session',
  'session_id',
  'jwt',
  'code',
  'credential',
]);

export interface NormalizedUrlResult {
  originalUrl: string;
  normalizedUrl: string;
  hostname: string;
  protocol: 'http:' | 'https:';
  isSafeForExternalQuery: boolean;
  sha256: string;
}

export interface NormalizedDomainResult {
  originalDomain: string;
  normalizedDomain: string;
  isSafeForExternalQuery: boolean;
  sha256: string;
}

export interface NormalizedCveResult {
  originalCve: string;
  normalizedCve: string;
  year: number;
  sequence: number;
}

export class ThreatIntelValidator {
  /**
   * Validates and normalizes an input URL.
   * Strips credentials, fragments, and sensitive query params.
   * Enforces SSRF barriers against local/private network targets.
   */
  static normalizeUrl(rawUrl: string): NormalizedUrlResult {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('URL indicator must be a non-empty string');
    }

    let trimmed = rawUrl.trim();
    if (trimmed.length > 2048) {
      throw new BadRequestException('URL exceeds maximum permitted length of 2048 characters');
    }

    // Default to https if protocol omitted, but preserve other schemes (e.g. file:, ftp:) so protocol check rejects them
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException('Malformed URL structure provided');
    }

    // Protocol check: only http and https allowed
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(
        `Unsupported URL protocol: ${parsed.protocol}. Only http: and https: are allowed`,
      );
    }

    // Remove user/password credentials (e.g. http://user:pass@example.com)
    parsed.username = '';
    parsed.password = '';

    // Remove fragment / anchor (#hash)
    parsed.hash = '';

    // Sanitize query params: strip sensitive credentials/tokens
    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];
    searchParams.forEach((_val, key) => {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        keysToDelete.push(key);
      }
    });
    for (const k of keysToDelete) {
      searchParams.delete(k);
    }
    parsed.search = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const hostname = parsed.hostname.toLowerCase().trim();
    this.assertSafeHostname(hostname);

    const normalizedUrl = parsed.toString();
    const sha256 = crypto.createHash('sha256').update(normalizedUrl).digest('hex');

    return {
      originalUrl: rawUrl,
      normalizedUrl,
      hostname,
      protocol: parsed.protocol as 'http:' | 'https:',
      isSafeForExternalQuery: true,
      sha256,
    };
  }

  /**
   * Validates and normalizes a domain / host name.
   */
  static normalizeDomain(rawDomain: string): NormalizedDomainResult {
    if (!rawDomain || typeof rawDomain !== 'string') {
      throw new BadRequestException('Domain indicator must be a non-empty string');
    }

    let normalized = rawDomain.trim().toLowerCase();

    // Remove protocol and trailing paths/ports if caller passed a full URL to domain lookup
    normalized = normalized.replace(/^https?:\/\//i, '');
    const firstSlash = normalized.indexOf('/');
    if (firstSlash !== -1) {
      normalized = normalized.slice(0, firstSlash);
    }
    const firstColon = normalized.indexOf(':');
    if (firstColon !== -1) {
      normalized = normalized.slice(0, firstColon);
    }
    normalized = normalized.replace(/\.+$/, ''); // strip trailing dots

    if (!normalized || normalized.length < 3 || normalized.length > 253) {
      throw new BadRequestException('Domain indicator length must be between 3 and 253 characters');
    }

    this.assertSafeHostname(normalized);

    // Ensure it looks like a valid domain or public IPv4
    const isIpv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized);
    if (!isIpv4 && !normalized.includes('.')) {
      throw new BadRequestException(
        'Domain indicator must contain at least one dot separating labels',
      );
    }

    const sha256 = crypto.createHash('sha256').update(normalized).digest('hex');

    return {
      originalDomain: rawDomain,
      normalizedDomain: normalized,
      isSafeForExternalQuery: true,
      sha256,
    };
  }

  /**
   * Validates and normalizes a CVE ID.
   * Standard format: CVE-YYYY-NNNNN+ (e.g. CVE-2021-44228).
   */
  static normalizeCve(rawCve: string): NormalizedCveResult {
    if (!rawCve || typeof rawCve !== 'string') {
      throw new BadRequestException('CVE identifier must be a non-empty string');
    }

    const trimmed = rawCve.trim().toUpperCase();
    const cveRegex = /^CVE-(\d{4})-(\d{4,8})$/;
    const match = trimmed.match(cveRegex);

    if (!match || !match[1] || !match[2]) {
      throw new BadRequestException(
        `Invalid CVE format: "${rawCve}". Expected format: CVE-YYYY-NNNNN (e.g. CVE-2021-44228)`,
      );
    }

    const year = parseInt(match[1], 10);
    const sequence = parseInt(match[2], 10);
    const currentYear = new Date().getFullYear();

    if (year < 1999 || year > currentYear + 1) {
      throw new BadRequestException(
        `Invalid CVE year: ${year}. Must be between 1999 and ${currentYear + 1}`,
      );
    }

    return {
      originalCve: rawCve,
      normalizedCve: `CVE-${year}-${match[2]}`,
      year,
      sequence,
    };
  }

  /**
   * Asserts that a hostname/IP does not target internal infrastructure (SSRF barrier).
   */
  private static assertSafeHostname(hostname: string): void {
    // 1. Reserved literal hostnames
    if (RESERVED_HOSTNAMES.has(hostname)) {
      throw new BadRequestException(
        `SSRF Protection: Queries targeting internal host "${hostname}" are forbidden`,
      );
    }

    // 2. Reserved TLD suffixes
    for (const suffix of RESERVED_TLD_SUFFIXES) {
      if (hostname.endsWith(suffix)) {
        throw new BadRequestException(
          `SSRF Protection: Queries targeting private TLD "${suffix}" are forbidden`,
        );
      }
    }

    // 3. IPv6 loopback / unique local
    if (
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('fc') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80')
    ) {
      throw new BadRequestException(
        `SSRF Protection: Queries targeting private IPv6 address "${hostname}" are forbidden`,
      );
    }

    // 4. IPv4 private / loopback / link-local
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      for (const pattern of PRIVATE_IPV4_PATTERNS) {
        if (pattern.test(hostname)) {
          throw new BadRequestException(
            `SSRF Protection: Queries targeting non-public IP "${hostname}" are forbidden`,
          );
        }
      }
    } else if (!hostname.includes('.')) {
      throw new BadRequestException(
        `Malformed hostname: "${hostname}" must contain at least one dot separating labels`,
      );
    }
  }
}
