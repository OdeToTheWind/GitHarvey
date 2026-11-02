import "server-only";

// Best-effort fixed-window limiter. Serverless memory is per-instance, so this
// slows abuse but is not a hard guarantee. Add a shared store only if needed.
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export function allow(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "unknown";
}

export function resetRateLimits(): void {
  buckets.clear();
}
