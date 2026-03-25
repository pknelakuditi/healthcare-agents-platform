export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export interface RateLimitRepository {
  consume(key: string, now: number, windowMs: number, maxRequests: number): RateLimitResult;
}

export interface ReplayProtectionRepository {
  claim(key: string, now: number, ttlSeconds: number): boolean;
}

type WindowState = {
  count: number;
  windowStartedAt: number;
};

export class InMemoryRateLimitRepository implements RateLimitRepository {
  private readonly windows = new Map<string, WindowState>();

  consume(key: string, now: number, windowMs: number, maxRequests: number): RateLimitResult {
    const window = this.windows.get(key);

    if (!window || now - window.windowStartedAt >= windowMs) {
      this.windows.set(key, {
        count: 1,
        windowStartedAt: now,
      });
      return {
        allowed: true,
        retryAfterSeconds: 0,
        remaining: Math.max(maxRequests - 1, 0),
      };
    }

    if (window.count >= maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((windowMs - (now - window.windowStartedAt)) / 1000),
        remaining: 0,
      };
    }

    window.count += 1;
    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(maxRequests - window.count, 0),
    };
  }
}

export class InMemoryReplayProtectionRepository implements ReplayProtectionRepository {
  private readonly entries = new Map<string, number>();

  claim(key: string, now: number, ttlSeconds: number): boolean {
    for (const [entryKey, expiresAt] of this.entries.entries()) {
      if (expiresAt <= now) {
        this.entries.delete(entryKey);
      }
    }

    if (this.entries.has(key)) {
      return false;
    }

    this.entries.set(key, now + (ttlSeconds * 1000));
    return true;
  }
}

export interface PerimeterRepositories {
  rateLimitRepository: RateLimitRepository;
  replayProtectionRepository: ReplayProtectionRepository;
  provider: 'memory';
}

export function createPerimeterRepositories(): PerimeterRepositories {
  return {
    rateLimitRepository: new InMemoryRateLimitRepository(),
    replayProtectionRepository: new InMemoryReplayProtectionRepository(),
    provider: 'memory',
  };
}
