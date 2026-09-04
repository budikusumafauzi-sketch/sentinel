import { Injectable, Inject, Optional, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import * as crypto from 'crypto';
import type { ThreatIntelResult, ThreatIntelType } from '@sentinel/types';
import { REDIS_CLIENT } from '../../redis/redis.module';

interface InMemoryCacheEntry {
  data: ThreatIntelResult;
  expiresAtMs: number;
}

@Injectable()
export class ThreatIntelCacheService {
  private readonly logger = new Logger(ThreatIntelCacheService.name);
  private readonly defaultTtlSeconds: number;
  private readonly memoryCache = new Map<string, InMemoryCacheEntry>();
  private readonly maxMemoryEntries = 5000; // bounded to prevent memory leaks

  constructor(
    private readonly configService: ConfigService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redisClient?: Redis,
  ) {
    this.defaultTtlSeconds = this.configService.get<number>('THREAT_INTEL_CACHE_TTL_SECONDS', 3600);
  }

  /**
   * Generates a deterministic, normalized cache key without secrets.
   * e.g. "threat_intel:url:<sha256(normalized_indicator)>"
   * e.g. "threat_intel:cve:<normalized_cve>"
   */
  generateKey(type: ThreatIntelType, normalizedIndicator: string): string {
    const safeType = type.toLowerCase();
    if (type === 'CVE') {
      return `threat_intel:cve:${normalizedIndicator.toUpperCase()}`;
    }
    // For URLs or long domains, use sha256 to ensure fixed-length, safe key
    const hash = crypto
      .createHash('sha256')
      .update(normalizedIndicator.toLowerCase())
      .digest('hex');
    return `threat_intel:${safeType}:${hash}`;
  }

  /**
   * Retrieves cached threat intelligence if fresh.
   * Returns null on cache miss or cache error.
   */
  async get(type: ThreatIntelType, normalizedIndicator: string): Promise<ThreatIntelResult | null> {
    const key = this.generateKey(type, normalizedIndicator);

    // 1. Try Redis if connected
    if (this.isRedisAvailable()) {
      try {
        const raw = await this.redisClient!.get(key);
        if (raw) {
          const parsed = JSON.parse(raw) as ThreatIntelResult;
          // Mark as cached
          parsed.cached = true;
          return parsed;
        }
      } catch (err: any) {
        this.logger.warn(
          `Redis cache get failed for key "${key}", falling back to in-memory: ${err.message}`,
        );
      }
    }

    // 2. Fallback to in-memory cache
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiresAtMs) {
        const result = { ...memEntry.data, cached: true };
        return result;
      }
      // Expired in memory
      this.memoryCache.delete(key);
    }

    return null;
  }

  /**
   * Stores threat intelligence in cache with TTL.
   */
  async set(
    type: ThreatIntelType,
    normalizedIndicator: string,
    result: ThreatIntelResult,
    customTtlSeconds?: number,
  ): Promise<void> {
    const key = this.generateKey(type, normalizedIndicator);
    const ttlSeconds = customTtlSeconds ?? this.getTtlForType(type);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const storedResult: ThreatIntelResult = {
      ...result,
      expiresAt,
      cached: false, // stored representation
    };

    // 1. Store in Redis if available
    if (this.isRedisAvailable()) {
      try {
        await this.redisClient!.set(key, JSON.stringify(storedResult), 'EX', ttlSeconds);
      } catch (err: any) {
        this.logger.warn(`Redis cache set failed for key "${key}": ${err.message}`);
      }
    }

    // 2. Store in memory cache (LRU eviction if limit reached)
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // Evict oldest 10%
      const keysToDelete = Array.from(this.memoryCache.keys()).slice(0, 500);
      for (const k of keysToDelete) {
        this.memoryCache.delete(k);
      }
    }

    this.memoryCache.set(key, {
      data: storedResult,
      expiresAtMs: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Evicts an entry from cache (e.g. for forceRefresh).
   */
  async delete(type: ThreatIntelType, normalizedIndicator: string): Promise<void> {
    const key = this.generateKey(type, normalizedIndicator);
    if (this.isRedisAvailable()) {
      try {
        await this.redisClient!.del(key);
      } catch (err: any) {
        this.logger.warn(`Redis cache del failed: ${err.message}`);
      }
    }
    this.memoryCache.delete(key);
  }

  /**
   * Clears in-memory cache (for testing or shutdown).
   */
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  private isRedisAvailable(): boolean {
    return !!this.redisClient && this.redisClient.status === 'ready';
  }

  private getTtlForType(type: ThreatIntelType): number {
    switch (type) {
      case 'CVE':
        return 86400; // 24 hours for official CVEs
      case 'URL':
      case 'DOMAIN':
        return 3600; // 1 hour for fast-moving malicious domains
      case 'EXPOSURE':
        return 7200; // 2 hours
      default:
        return this.defaultTtlSeconds;
    }
  }
}
