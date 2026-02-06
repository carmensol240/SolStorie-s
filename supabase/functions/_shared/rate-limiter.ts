// Simple in-memory rate limiter for Edge Functions
// Note: In a distributed environment, consider using Upstash Redis for persistence

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredEntries, 60000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP, email, device_id)
 * @param prefix - Prefix to namespace the rate limit (e.g., "password-reset", "contact-form")
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  prefix: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = req.headers.get("cf-connecting-ip");
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback
  return "unknown";
}

/**
 * Create a rate limit error response
 */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
  message = "יותר מדי בקשות. נסה שוב מאוחר יותר."
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  contactForm: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  trackEvent: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  aiFunction: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
};
