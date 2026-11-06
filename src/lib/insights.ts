import type { RepoSummary } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MERGED_SAMPLES = 3;
const STARTER_TOPICS = new Set(["starter", "starter-kit", "boilerplate", "template", "tutorial", "example", "examples", "sample", "demo", "learn", "learning"]);

export interface PullSample {
  createdAt: string;
  mergedAt: string | null;
}

/** Median days from opening to merging, over the merged pull requests. Needs a few samples to mean anything. */
export function medianMergeDays(pulls: PullSample[]): { medianDays: number; sampled: number } | null {
  const days = pulls
    .flatMap((p) => {
      if (!p.mergedAt) return [];
      const d = (Date.parse(p.mergedAt) - Date.parse(p.createdAt)) / DAY_MS;
      return Number.isFinite(d) && d >= 0 ? [d] : [];
    })
    .sort((a, b) => a - b);
  if (days.length < MIN_MERGED_SAMPLES) return null;
  const mid = Math.floor(days.length / 2);
  const median = days.length % 2 === 1 ? days[mid] : ((days[mid - 1] ?? 0) + (days[mid] ?? 0)) / 2;
  return { medianDays: median ?? 0, sampled: days.length };
}

export function describeMergeTime(days: number): string {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))} hours`;
  return `${Math.round(days * 10) / 10} days`;
}

export type Trend = "rising" | "steady" | "declining" | "quiet";

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

/** Compares the last 13 weeks of commits with the 13 before. Needs at least 26 weeks of data. */
export function trendOf(weeks: number[] | null): Trend | null {
  if (!weeks || weeks.length < 26) return null;
  const half = weeks.slice(-26);
  const earlier = sum(half.slice(0, 13));
  const recent = sum(half.slice(13));
  if (earlier + recent < 10) return "quiet";
  if (recent > earlier * 1.25) return "rising";
  if (recent < earlier * 0.75) return "declining";
  return "steady";
}

export const TREND_LABELS: Record<Trend, string> = {
  rising: "Rising: more commits lately",
  steady: "Steady",
  declining: "Declining: fewer commits lately",
  quiet: "Quiet: very few commits",
};

/** A plain warning for repos that are archived or have gone a year without a push. */
export function abandonedNote(repo: RepoSummary, now: number = Date.now()): string | null {
  if (repo.archived) return "Archived by its owner. No new work is expected.";
  const pushed = Date.parse(repo.pushedAt);
  if (Number.isFinite(pushed) && now - pushed > 365 * DAY_MS) return "No push in over a year. It may be abandoned.";
  return null;
}

/** A rough size tag. Repository size includes history, so treat it as a hint, not a measurement. */
export function sizeTag(repo: RepoSummary): string | null {
  if (repo.topics.some((t) => STARTER_TOPICS.has(t))) return "Starter or example";
  if (repo.sizeKb <= 0) return null;
  if (repo.sizeKb < 2_000) return "Small codebase";
  if (repo.sizeKb < 30_000) return "Medium codebase";
  return "Large codebase";
}

/** Number of entries under "dependencies" in a package.json. Null when the text is not valid JSON. */
export function countPackageJson(text: string): number | null {
  try {
    const parsed: unknown = JSON.parse(text);
    const deps = typeof parsed === "object" && parsed !== null ? (parsed as { dependencies?: unknown }).dependencies : undefined;
    return typeof deps === "object" && deps !== null && !Array.isArray(deps) ? Object.keys(deps).length : 0;
  } catch {
    return null;
  }
}

/** Number of package lines in a requirements.txt. Comments, blanks and option lines (-r, -e) are skipped. */
export function countRequirements(text: string): number {
  return text.split("\n").filter((line) => {
    const t = line.trim();
    return t !== "" && !t.startsWith("#") && !t.startsWith("-");
  }).length;
}
