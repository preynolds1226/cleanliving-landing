import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null | undefined;

/**
 * Optional per-IP sliding window when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Configure RATELIMIT_PER_MINUTE (default 30, max 300).
 */
export async function limitAnalyzeRequest(clientKey: string): Promise<{ ok: boolean }> {
  if (ratelimit === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      ratelimit = null;
    } else {
      const redis = new Redis({ url, token });
      const perMinute = Math.max(
        1,
        Math.min(300, Number(process.env.RATELIMIT_PER_MINUTE ?? 30))
      );
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(perMinute, '1 m'),
        prefix: 'cleanliving-analyze',
      });
    }
  }
  if (!ratelimit) return { ok: true };
  const { success } = await ratelimit.limit(clientKey);
  return { ok: success };
}
