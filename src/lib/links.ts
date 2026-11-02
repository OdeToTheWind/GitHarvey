import type { ScoringPrefs } from "@/types";

/** A compare link. Carries the visitor's scoring settings so scores match the finder. No token, ever. */
export function compareHref(names: string[], scoring?: ScoringPrefs): string {
  const params = new URLSearchParams({ repos: names.join(",") });
  if (scoring) {
    params.set("aud", scoring.audience);
    if (scoring.goal) params.set("goal", scoring.goal);
    if (scoring.priorities.length > 0) params.set("pri", scoring.priorities.join(","));
  }
  return `/compare?${params.toString()}`;
}
