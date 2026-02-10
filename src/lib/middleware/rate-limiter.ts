import "server-only";

/**
 * In-memory sliding window rate limiter.
 * Tracks timestamps of requests per key and checks against window/limit.
 * Auto-cleans stale entries every 5 minutes.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Auto-cleanup every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 3600_000);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, CLEANUP_INTERVAL);
  // Don't block process exit
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export type RateLimitTier = "general" | "meme_generation" | "voting";

const TIER_CONFIG: Record<RateLimitTier, { windowMs: number; maxRequests: number }> = {
  general: { windowMs: 60_000, maxRequests: 60 },
  meme_generation: { windowMs: 3600_000, maxRequests: 10 },
  voting: { windowMs: 60_000, maxRequests: 120 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number | null;
}

export function checkRateLimit(
  agentId: string,
  tier: RateLimitTier
): RateLimitResult {
  ensureCleanup();

  const config = TIER_CONFIG[tier];
  const key = `${agentId}:${tier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    // Find when the oldest request in the window expires
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    limit: config.maxRequests,
    retryAfterSeconds: null,
  };
}
