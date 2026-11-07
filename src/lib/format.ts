import { MAX_COMPARE, MIN_COMPARE } from "./compare";
import { isValidRepoName } from "./repoName";

const DAY_MS = 24 * 60 * 60 * 1000;

export function ago(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "never";
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "unknown";
  const days = Math.floor(Math.max(0, now - time) / DAY_MS);
  if (days < 1) return "today";
  if (days < 60) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 730) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/** A span of time such as "5 years" or "3 months". For ages, where "ago" would read oddly. */
export function age(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "unknown";
  const days = Math.floor(Math.max(0, now - time) / DAY_MS);
  if (days < 60) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 730) return `${Math.floor(days / 30)} months`;
  return `${Math.floor(days / 365)} years`;
}

export type CompareParse = { ok: true; names: string[] } | { ok: false; reason: "too-few" | "too-many" | "invalid" };

/** Parses ?repos=a/b,c/d. Needs 2 to 10 valid, distinct repo names; otherwise not ok, and says why. */
export function parseCompare(value: string | undefined): CompareParse {
  const names = Array.from(new Set((value ?? "").split(",").map((n) => n.trim()).filter(Boolean)));
  if (!names.every(isValidRepoName)) return { ok: false, reason: "invalid" };
  if (names.length > MAX_COMPARE) return { ok: false, reason: "too-many" };
  if (names.length < MIN_COMPARE) return { ok: false, reason: "too-few" };
  return { ok: true, names };
}
