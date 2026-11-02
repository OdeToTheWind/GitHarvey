import "server-only";

// In-memory cache for PUBLIC GitHub responses. Keys are request paths, never
// tokens. Per-instance on serverless, so it helps but is not a guarantee.
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 300;

interface Entry {
  value: unknown;
  expires: number;
}

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function clearCache(): void {
  memory.clear();
  inflight.clear();
}

/** Runs `load` once per key within the TTL. Errors are never cached. */
export async function cached<T>(key: string, load: () => Promise<T>, now: number = Date.now()): Promise<T> {
  // Cache keys are GitHub request paths. Anything else is a bug (or a token).
  if (!key.startsWith("/") || /\s/.test(key)) throw new Error("Invalid cache key.");

  const hit = memory.get(key);
  if (hit && hit.expires > now) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      if (memory.size >= MAX_ENTRIES) {
        const oldest = memory.keys().next().value;
        if (oldest !== undefined) memory.delete(oldest);
      }
      memory.set(key, { value, expires: now + TTL_MS });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}
