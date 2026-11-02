export type Audience = "beginner" | "developer" | "security" | "founder";
export type Goal = "learn" | "build" | "compare" | "stay-updated";
export type Priority =
  | "maintained"
  | "beginner-friendly"
  | "popular"
  | "permissive-license";

export interface Preferences {
  audience: Audience;
  goal: Goal;
  topic: string; // free text, max 80 chars
  language?: string;
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

/** What scoring needs to know about the visitor. */
export type ScoringPrefs = Pick<Preferences, "audience" | "priorities"> & { goal?: Goal };

export interface ScoredRepo {
  repo: RepoSummary;
  health: RepoHealth;
  score: number; // 0-100
  badge: "green" | "yellow" | "red";
  reasons: string[];
  breakdown: ScoreLine[];
}

export interface RateInfo {
  remaining: number | null;
  resetAt: string | null; // ISO
}
