import { getRedisClient } from '../redis.js';

const CACHE_PREFIX = 'rc:';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<{ data: T; isStale: boolean } | null>;
  set<T>(key: string, data: T, ttlSeconds: number, staleGraceSeconds?: number): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

export async function createRedisCache(): Promise<CacheStore> {
  const client = await getRedisClient();

  if (!client) {
    console.warn('[RedisCache] Redis unavailable — cache disabled');
    return createNoOpCache();
  }

  return {
    async get<T>(key: string): Promise<{ data: T; isStale: boolean } | null> {
      try {
        const raw = await client.get(`${CACHE_PREFIX}${key}`);
        if (!raw) return null;

        const entry: CacheEntry<T> = JSON.parse(String(raw));
        const now = Date.now();

        if (now > entry.staleAt) {
          await client.del(`${CACHE_PREFIX}${key}`);
          return null;
        }

        return {
          data: entry.data,
          isStale: now > entry.expiresAt,
        };
      } catch (err) {
        console.error('[RedisCache] get error:', err);
        return null;
      }
    },

    async set<T>(key: string, data: T, ttlSeconds: number, staleGraceSeconds = 0): Promise<void> {
      try {
        const now = Date.now();
        const entry: CacheEntry<T> = {
          data,
          expiresAt: now + ttlSeconds * 1000,
          staleAt: now + (ttlSeconds + staleGraceSeconds) * 1000,
        };
        const totalTtl = ttlSeconds + staleGraceSeconds;
        await client.setEx(`${CACHE_PREFIX}${key}`, totalTtl, JSON.stringify(entry));
      } catch (err) {
        console.error('[RedisCache] set error:', err);
      }
    },

    async invalidatePattern(pattern: string): Promise<void> {
      try {
        const fullPattern = `${CACHE_PREFIX}${pattern}`;
        let cursor = 0;
        let deleted = 0;

        do {
          const result = await client.scan(String(cursor), {
            MATCH: fullPattern,
            COUNT: 100,
          });
          cursor = parseInt(String(result.cursor), 10);
          const keys = (result.keys as (string | Buffer<ArrayBufferLike>)[]).map(k => String(k));

          if (keys.length > 0) {
            await client.del(keys);
            deleted += keys.length;
          }
        } while (cursor !== 0);

        if (deleted > 0) {
          console.log(`[RedisCache] Invalidated ${deleted} keys matching "${pattern}"`);
        }
      } catch (err) {
        console.error('[RedisCache] invalidatePattern error:', err);
      }
    },
  };
}

function createNoOpCache(): CacheStore {
  return {
    get: async () => null,
    set: async () => {},
    invalidatePattern: async () => {},
  };
}
