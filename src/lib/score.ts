import type { RepoHealth, RepoSummary, ScoredRepo, ScoreLine, ScoringPrefs } from "@/types";
import { ago } from "./format";
import { weightsFor } from "./profiles";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERMISSIVE = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Unlicense",
]);
const RELEASE_BONUS = 0.05;

export const DEFAULT_SCORING: ScoringPrefs = { audience: "developer", priorities: [] };

function daysSince(iso: string | null, now: number): number | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  // A pushedAt in the future counts as "today".
  return Number.isFinite(time) ? Math.max(0, (now - time) / DAY_MS) : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Scoring rules are documented in docs/how-scoring-works.md. */
export function scoreRepo(
  repo: RepoSummary,
  health: RepoHealth,
  prefs: ScoringPrefs = DEFAULT_SCORING,
  now: number = Date.now(),
): ScoredRepo {
  const w = weightsFor(prefs.audience, prefs.goal);
  const pushed = daysSince(repo.pushedAt, now);
  const recency = pushed === null ? 0 : pushed < 30 ? 1 : pushed < 180 ? 0.6 : pushed < 365 ? 0.3 : 0;

  const permissiveOnly = prefs.priorities.includes("permissive-license");
  const license = !repo.license ? 0 : permissiveOnly && !PERMISSIVE.has(repo.license) ? 0.5 : 1;
  const docs = repo.homepage ? 1 : 0.5;
  const popularity = Math.min(Math.log10(repo.stars + 1) / 5, 1);

  const released = daysSince(health.lastReleaseAt, now);
  const releaseBonus = released !== null && released < 365 ? RELEASE_BONUS : 0;
  const releaseKnown = health.checked !== false;

  const total = Math.min(
    1,
    recency * w.recency + license * w.license + docs * w.docs + popularity * w.popularity + releaseBonus,
  );
  let score = Math.round(total * 100);
  if (repo.archived) score = Math.min(score, 20);
  const badge = repo.archived ? "red" : score >= 70 ? "green" : score >= 40 ? "yellow" : "red";

  const licenseText = repo.license ? (repo.license === "Other" ? "Custom" : repo.license) : "No license";
  const breakdown: ScoreLine[] = [
    { label: "Recent activity", detail: `Updated ${ago(repo.pushedAt, now)}`, points: round1(recency * w.recency * 100), max: round1(w.recency * 100) },
    { label: "License", detail: licenseText, points: round1(license * w.license * 100), max: round1(w.license * 100) },
    { label: "Docs", detail: repo.homepage ? "Has a homepage" : "No homepage listed", points: round1(docs * w.docs * 100), max: round1(w.docs * 100) },
    { label: "Popularity", detail: `${repo.stars.toLocaleString("en-US")} stars`, points: round1(popularity * w.popularity * 100), max: round1(w.popularity * 100) },
    {
      label: "Release bonus",
      detail: !releaseKnown ? "Not checked yet. Press Expand" : releaseBonus > 0 ? "Release in the last year" : "No release in the last year (neutral)",
      points: releaseBonus * 100,
      max: RELEASE_BONUS * 100,
    },
  ];

  const reasons: string[] = [];
  if (repo.archived) reasons.push("Archived");
  reasons.push(`Updated ${ago(repo.pushedAt, now)}`);
  reasons.push(repo.license ? `${licenseText} license` : "No license");
  if (releaseBonus > 0) reasons.push("Release in the last year");
  return { repo, health, score, badge, reasons: reasons.slice(0, 4), breakdown };
}
