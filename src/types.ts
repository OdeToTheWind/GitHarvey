/** "default" is the no-profile choice: balanced scoring, no assumptions about who you are. */
export type Audience = "default" | "beginner" | "developer" | "security" | "founder";
/** "default" means "just search": no special goal. */
export type Goal = "default" | "learn" | "build" | "compare" | "stay-updated";
export type Priority =
  | "maintained"
  | "beginner-friendly"
  | "popular"
  | "permissive-license"
  | "any"; // no filters at all: every kind of repo, however small or old

export interface Preferences {
  audience: Audience;
  goal: Goal;
  topic: string; // free text, max 80 chars
  language?: string; // one of the listed languages, or any language the visitor typed
  priorities: Priority[];
}

export interface RepoSummary {
  id: number;
  fullName: string; // owner/repo
  description: string | null;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  license: string | null; // SPDX id, "Other", or null
  pushedAt: string;
  createdAt: string;
  topics: string[];
  archived: boolean;
  homepage: string | null;
  sizeKb: number; // repository size on GitHub, a rough guide to how big the codebase is
}

export interface RepoHealth {
  lastReleaseAt: string | null;
  /** False until the release lookup has run (search results are scored without it). */
  checked?: boolean;
}

/** One row of the "why this score" breakdown. */
export interface ScoreLine {
  label: string;
  detail: string;
  points: number;
  max: number;
}

/** How much each signal counts. A set sums to 1 (see profiles.ts). */
export interface Weights {
  recency: number;
  license: number;
  docs: number;
  popularity: number;
}

/** What scoring needs to know about the visitor. `weights` is set only when they tune the score by hand. */
export type ScoringPrefs = Pick<Preferences, "audience" | "priorities"> & { goal?: Goal; weights?: Weights };

export interface ScoredRepo {
  repo: RepoSummary;
  health: RepoHealth;
  score: number; // 0-100
  badge: "green" | "yellow" | "red";
  reasons: string[];
  breakdown: ScoreLine[];
}

/** Extra facts loaded on demand (Expand, detail page, compare). Information only: never part of the score. */
export interface RepoExtras {
  mergeSpeed: { medianDays: number; sampled: number } | null;
  contributors: number | null;
  weeklyCommits: number[] | null; // last 52 weeks, oldest first
  goodFirstIssues: number | null;
  dependencies: { count: number; file: string } | null;
}

export interface RepoDetails {
  health: RepoHealth;
  extras: RepoExtras;
}

export interface RateInfo {
  remaining: number | null;
  resetAt: string | null; // ISO
}
