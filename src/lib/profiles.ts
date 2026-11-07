import type { Audience, Goal, Weights } from "@/types";

// Each set sums to 1.0 (a test checks this).
export const PROFILES: Record<Audience, Weights> = {
  default: { recency: 0.3, license: 0.15, docs: 0.2, popularity: 0.35 },
  beginner: { recency: 0.2, license: 0.1, docs: 0.4, popularity: 0.3 },
  developer: { recency: 0.4, license: 0.15, docs: 0.15, popularity: 0.3 },
  security: { recency: 0.5, license: 0.1, docs: 0.1, popularity: 0.3 },
  founder: { recency: 0.3, license: 0.3, docs: 0.1, popularity: 0.3 },
};

/** Learning favours good docs over raw popularity. Other goals use the audience weights as they are. */
export function weightsFor(audience: Audience, goal?: Goal): Weights {
  const base = PROFILES[audience];
  if (goal !== "learn") return base;
  return { ...base, docs: base.docs + 0.1, popularity: base.popularity - 0.1 };
}
