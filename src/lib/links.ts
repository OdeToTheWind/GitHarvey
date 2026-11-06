import type { ScoringPrefs } from "@/types";

function scoringParams(params: URLSearchParams, scoring?: ScoringPrefs): void {
  if (!scoring) return;
  params.set("aud", scoring.audience);
  if (scoring.goal) params.set("goal", scoring.goal);
  if (scoring.priorities.length > 0) params.set("pri", scoring.priorities.join(","));
}

/** A compare link. Carries the visitor's scoring settings so scores match the finder. No token, ever. */
export function compareHref(names: string[], scoring?: ScoringPrefs): string {
  const params = new URLSearchParams({ repos: names.join(",") });
  scoringParams(params, scoring);
  return `/compare?${params.toString()}`;
}

/** A detail-page link for one repo. Holds the repo name and scoring settings only. */
export function repoHref(fullName: string, scoring?: ScoringPrefs): string {
  const params = new URLSearchParams();
  scoringParams(params, scoring);
  const query = params.toString();
  return `/repo/${fullName}${query ? `?${query}` : ""}`;
}

/** The sign-in address. `next` (one of our own result pages) is where to land afterwards. */
export function signInHref(next?: string | null): string {
  return next ? `/api/auth/github?next=${encodeURIComponent(next)}` : "/api/auth/github";
}
