import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Graceful degradation: if Upstash credentials are missing, we surface a
// clear error in development but do NOT crash the build/import chain.
// In production without credentials, rate limiting becomes a passthrough.
// ---------------------------------------------------------------------------

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  [rate-limit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.\n" +
          "   Rate limiting is DISABLED. All requests will pass through.\n" +
          "   Set these variables in .env.local to enable rate limiting."
      );
    }
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedisClient();

// ---------------------------------------------------------------------------
// Limiter factories
// ---------------------------------------------------------------------------

/**
 * General API rate limiter: 60 requests per 1 minute sliding window.
 * Used for all tRPC routes by default.
 */
export const apiLimiter: Ratelimit | null = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : null;

/**
 * Form / submission rate limiter: 10 requests per 1 minute sliding window.
 * Used specifically for assessment submission and guest-lead creation
 * endpoints to prevent abuse.
 */
export const formLimiter: Ratelimit | null = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:form",
    })
  : null;

// ---------------------------------------------------------------------------
// Helper: check rate limit with graceful fallback
// ---------------------------------------------------------------------------

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks the rate limit for a given identifier. If the rate limiter is
 * unavailable (missing Redis credentials), this returns a successful result
 * — effectively a passthrough — so the request is never blocked due to
 * infrastructure misconfiguration.
 *
 * @param limiter - The Ratelimit instance (apiLimiter or formLimiter)
 * @param identifier - Unique key, typically an IP hash or session ID
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    // Passthrough: rate limiting is disabled
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // If Redis is unreachable at runtime, log and allow the request through.
    // This prevents a Redis outage from cascading into a full API outage.
    console.error("[rate-limit] Redis error, allowing request through:", error);
    return { success: true, limit: -1, remaining: -1, reset: 0 };
  }
}
