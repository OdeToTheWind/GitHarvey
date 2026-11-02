import type { ScoredRepo } from "@/types";

/** Indexes holding the best value (ties included). Nulls never win. */
export function bestIndexes(values: (number | null)[], mode: "max" | "min" = "max"): Set<number> {
  const real = values.filter((v): v is number => v !== null);
  if (real.length === 0) return new Set();
  const target = mode === "max" ? Math.max(...real) : Math.min(...real);
  return new Set(values.flatMap((v, i) => (v === target ? [i] : [])));
}

function time(iso: string | null): number | null {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
}

export const pushedTimes = (items: ScoredRepo[]) => items.map((r) => time(r.repo.pushedAt));
export const releaseTimes = (items: ScoredRepo[]) => items.map((r) => time(r.health.lastReleaseAt));

/** Data-only summary line. No AI involved. */
export function verdict(items: ScoredRepo[]): string {
  const name = (set: Set<number>) =>
    Array.from(set, (i) => items[i]?.repo.fullName).filter(Boolean).join(" / ");
  const score = bestIndexes(items.map((r) => r.score));
  const recent = bestIndexes(pushedTimes(items));
  const popular = bestIndexes(items.map((r) => r.repo.stars));
  return `Highest score: ${name(score)}. Most recently updated: ${name(recent)}. Most popular: ${name(popular)}.`;
}
