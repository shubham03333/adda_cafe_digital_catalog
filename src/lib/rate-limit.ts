type Bucket = { count: number; resetAt: number };

const hits = new Map<string, Bucket>();

function prune(now: number) {
  if (hits.size < 5000) return;
  for (const [key, bucket] of hits) {
    if (bucket.resetAt < now) hits.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  prune(now);
  const bucket = hits.get(key);
  if (!bucket || bucket.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}
