import redis from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: ReturnType<typeof redis.createClient> | null = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }
  
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('[REDIS ERROR]', err);
      redisClient = null;
    });
    await redisClient.connect();
    console.log('[REDIS] Connected successfully');
    return redisClient;
  } catch (error) {
    console.error('[REDIS] Failed to connect:', error);
    redisClient = null;
    return null;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = await getRedisClient();
  
  if (!client) {
    console.warn('[RATE LIMIT] Redis unavailable, allowing request');
    return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs };
  }

  const now = Date.now();
  const windowKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
  const fullKey = `${windowKey}:${now}`;

  try {
    const current = parseInt(String(await client.incr(windowKey)));
    
    if (current === 1) {
      await client.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    const ttl = parseInt(String(await client.ttl(windowKey)));
    const resetTime = now + (ttl > 0 ? ttl * 1000 : windowMs);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime,
    };
  } catch (error) {
    console.error('[RATE LIMIT] Redis error:', error);
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }
}

export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}