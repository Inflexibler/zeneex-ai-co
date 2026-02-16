import { RateLimitError } from "../utils/error-handler";
import { logger } from "../utils/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  constructor(
    private windowMs: number = 60000,
    private maxRequests: number = 100
  ) {}

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.store.set(identifier, newEntry);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: newEntry.resetTime,
      };
    }

    if (entry.count >= this.maxRequests) {
      logger.warn("Rate limit exceeded", { identifier, count: entry.count });
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`
      );
    }

    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const limiters = new Map<string, RateLimiter>();

function getLimiter(key: string, windowMs: number, maxRequests: number): RateLimiter {
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiter(windowMs, maxRequests));
  }
  return limiters.get(key)!;
}

export function checkRateLimit(
  identifier: string,
  type: "auth" | "api" | "aiGeneration" | "admin" = "api"
): { allowed: boolean; remaining: number; resetTime: number } {
  const limits: Record<string, { windowMs: number; maxRequests: number }> = {
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
    api: { windowMs: 60 * 1000, maxRequests: 100 },
    aiGeneration: { windowMs: 60 * 1000, maxRequests: 10 },
    admin: { windowMs: 60 * 1000, maxRequests: 200 },
  };

  const config = limits[type];
  const limiter = getLimiter(type, config.windowMs, config.maxRequests);

  return limiter.check(identifier);
}

export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `${ip}:${userAgent}`;
}

export function getUserIdentifer(userId: string): string {
  return `user:${userId}`;
}

export function resetRateLimit(identifier: string): void {
  for (const limiter of limiters.values()) {
    limiter.reset(identifier);
  }
}

setInterval(() => {
  for (const limiter of limiters.values()) {
    limiter.cleanup();
  }
}, 60 * 1000);
