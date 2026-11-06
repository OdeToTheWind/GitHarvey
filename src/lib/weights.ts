import type { Weights } from "@/types";

export const WEIGHT_KEYS = ["recency", "license", "docs", "popularity"] as const;

export const WEIGHT_LABELS: Record<(typeof WEIGHT_KEYS)[number], string> = {
  recency: "Recent activity",
  license: "License",
  docs: "Docs",
  popularity: "Popularity",
};

const MAX_IMPORTANCE = 10;

/** Turns slider values (0 to 10 each) into weights that sum to 1. Returns null when every slider is 0. */
export function weightsFromImportance(importance: Weights): Weights | null {
  const total = WEIGHT_KEYS.reduce((n, k) => n + importance[k], 0);
  if (total <= 0) return null;
  return {
    recency: importance.recency / total,
    license: importance.license / total,
    docs: importance.docs / total,
    popularity: importance.popularity / total,
  };
}

/** The slider position (0 to 10) that best matches a set of weights. */
export function importanceFromWeights(weights: Weights): Weights {
  const scale = (n: number) => Math.min(MAX_IMPORTANCE, Math.max(0, Math.round(n * 20)));
  return {
    recency: scale(weights.recency),
    license: scale(weights.license),
    docs: scale(weights.docs),
    popularity: scale(weights.popularity),
  };
}
