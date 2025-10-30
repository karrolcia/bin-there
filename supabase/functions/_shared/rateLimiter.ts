interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  let restUrl = Deno.env.get('UPSTASH_REDIS_REST_URL');
  let restToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

  // Remove quotes if they exist (fix for quoted env vars)
  if (restUrl?.startsWith('"') && restUrl?.endsWith('"')) {
    restUrl = restUrl.slice(1, -1);
  }
  if (restToken?.startsWith('"') && restToken?.endsWith('"')) {
    restToken = restToken.slice(1, -1);
  }

  if (!restUrl || !restToken) {
    console.warn('Rate limiter unavailable (missing credentials), allowing request');
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds,
      limit: config.maxRequests,
    };
  }

  try {
    const currentWindow = Math.floor(Date.now() / 1000 / config.windowSeconds);
    const key = `ratelimit:${endpoint}:${identifier}:${currentWindow}`;

    // Increment counter atomically
    const incrResponse = await fetch(`${restUrl}/incr/${key}`, {
      headers: { Authorization: `Bearer ${restToken}` },
    });

    if (!incrResponse.ok) {
      throw new Error('Redis INCR failed');
    }

    const incrData = await incrResponse.json();
    const currentCount = incrData.result as number;

    // Set expiration on first request
    if (currentCount === 1) {
      await fetch(`${restUrl}/expire/${key}/${config.windowSeconds}`, {
        headers: { Authorization: `Bearer ${restToken}` },
      });
    }

    const allowed = currentCount <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetAt = (currentWindow + 1) * config.windowSeconds;

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error) {
    console.error('Rate limiter error:', error);
    console.warn('Rate limiter unavailable, allowing request');
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Math.floor(Date.now() / 1000) + config.windowSeconds,
      limit: config.maxRequests,
    };
  }
}

export function createRateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>): Response {
  const retryAfter = result.resetAt - Math.floor(Date.now() / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      retryAfter,
      limit: result.limit,
      remaining: result.remaining,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  );
}
