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

/** Parses ?repos=a/b,c/d. Needs 2-3 valid, distinct repo names; otherwise not ok. */
export function parseCompare(value: string | undefined): { ok: true; names: string[] } | { ok: false } {
  const names = Array.from(new Set((value ?? "").split(",").map((n) => n.trim()).filter(Boolean)));
  if (names.length < 2 || names.length > 3 || !names.every(isValidRepoName)) return { ok: false };
  return { ok: true, names };
}
