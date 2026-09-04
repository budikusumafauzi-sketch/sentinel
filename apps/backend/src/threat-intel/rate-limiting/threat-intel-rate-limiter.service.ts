import { Injectable, Logger } from '@nestjs/common';

interface RateLimitTracker {
  requestsInWindow: number;
  windowStartMs: number;
  cooldownUntilMs?: number;
}

@Injectable()
export class ThreatIntelRateLimiterService {
  private readonly logger = new Logger(ThreatIntelRateLimiterService.name);
  private readonly trackers = new Map<string, RateLimitTracker>();

  // Default provider request limits per 60-second window
  private readonly defaultLimits: Record<string, number> = {
    cisa_kev: 120, // Feed is locally cached; updates are infrequent
    osv: 60, // OSV.dev public endpoint
    urlhaus: 30, // abuse.ch public feed/API
    openphish: 30, // OpenPhish community feed
    exposure: 60,
  };

  /**
   * Checks whether a provider is currently rate-limited or in cooldown.
   */
  isRateLimited(providerId: string): boolean {
    const tracker = this.trackers.get(providerId);
    if (!tracker) return false;

    const now = Date.now();

    // Check active cooldown from previous 429
    if (tracker.cooldownUntilMs && now < tracker.cooldownUntilMs) {
      return true;
    }

    // Reset window if expired (60s window)
    if (now - tracker.windowStartMs > 60000) {
      tracker.requestsInWindow = 0;
      tracker.windowStartMs = now;
      tracker.cooldownUntilMs = undefined;
      return false;
    }

    const limit = this.defaultLimits[providerId] || 60;
    return tracker.requestsInWindow >= limit;
  }

  /**
   * Records a request initiation to a provider.
   */
  recordRequest(providerId: string): void {
    const now = Date.now();
    let tracker = this.trackers.get(providerId);
    if (!tracker || now - tracker.windowStartMs > 60000) {
      tracker = {
        requestsInWindow: 1,
        windowStartMs: now,
      };
      this.trackers.set(providerId, tracker);
    } else {
      tracker.requestsInWindow += 1;
    }
  }

  /**
   * Records an explicit rate-limit (HTTP 429) received from an external provider.
   * Sets a bounded cooldown period (default 60s, max 300s).
   */
  recordRateLimitResponse(providerId: string, retryAfterSeconds?: number): void {
    const cooldownSeconds = Math.min(Math.max(retryAfterSeconds || 60, 10), 300);
    const cooldownUntilMs = Date.now() + cooldownSeconds * 1000;

    const tracker = this.trackers.get(providerId) || {
      requestsInWindow: 1,
      windowStartMs: Date.now(),
    };
    tracker.cooldownUntilMs = cooldownUntilMs;
    this.trackers.set(providerId, tracker);

    this.logger.warn(
      `Provider [${providerId}] is rate-limited. Placed in cooldown for ${cooldownSeconds}s (until ${new Date(
        cooldownUntilMs,
      ).toISOString()})`,
    );
  }

  /**
   * Executes an async operation with bounded retry and exponential backoff.
   * STRICT RULES:
   * - Max 1 retry for transient network/5xx errors.
   * - ZERO retries if rate-limited (HTTP 429) or client error (4xx).
   * - Zero infinite retry loops.
   */
  async executeWithRetry<T>(
    providerId: string,
    operation: () => Promise<T>,
    options?: { maxRetries?: number; initialDelayMs?: number },
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 1; // max 1 retry by default
    const initialDelayMs = options?.initialDelayMs ?? 500;

    let attempt = 0;

    while (attempt <= maxRetries) {
      if (this.isRateLimited(providerId)) {
        const err = new Error(`Provider [${providerId}] is currently rate-limited`);
        (err as any).status = 429;
        (err as any).code = 'RATE_LIMITED';
        throw err;
      }

      this.recordRequest(providerId);

      try {
        return await operation();
      } catch (err: any) {
        attempt++;

        // Detect HTTP 429
        if (err.status === 429 || err.code === 'RATE_LIMITED' || /rate.?limit/i.test(err.message)) {
          this.recordRateLimitResponse(providerId, err.retryAfter);
          throw err; // Do not retry on 429
        }

        // Do not retry 4xx errors (client errors)
        if (err.status >= 400 && err.status < 500) {
          throw err;
        }

        // If retries exhausted, rethrow
        if (attempt > maxRetries) {
          this.logger.warn(
            `Provider [${providerId}] retries exhausted after ${attempt} attempts: ${err.message}`,
          );
          throw err;
        }

        // Bounded exponential backoff delay
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        this.logger.debug(
          `Provider [${providerId}] retrying attempt ${attempt}/${maxRetries} after ${delay}ms`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }

    throw new Error(`Provider [${providerId}] failed after bounded retries`);
  }
}
