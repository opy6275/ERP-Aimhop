const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limit (per process) with automatic memory eviction. */
export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();

  // Prune expired entries periodically to prevent memory accumulation
  if (buckets.size > 2000) {
    for (const [k, v] of buckets.entries()) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }

  const cur = buckets.get(key);
  if (!cur || cur.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (cur.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: cur.resetAt - now };
  }
  cur.count += 1;
  return { ok: true, remaining: limit - cur.count };
}

export function maskAccountNumber(value: string | null | undefined) {
  if (!value) return null;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}
