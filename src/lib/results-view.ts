import type { ScoredRepo } from "@/types";
import { licenseKind } from "./licenses";

export type SortKey = "health" | "stars" | "recent";
export type LicenseFilter = "any" | "licensed" | "permissive";

export interface ResultsView {
  sort: SortKey;
  license: LicenseFilter;
  minStars: number;
}

export const DEFAULT_VIEW: ResultsView = { sort: "health", license: "any", minStars: 0 };

function passes(item: ScoredRepo, view: ResultsView): boolean {
  if (item.repo.stars < view.minStars) return false;
  if (view.license === "licensed") return item.repo.license !== null;
  if (view.license === "permissive") return licenseKind(item.repo.license) === "permissive";
  return true;
}

function compare(view: ResultsView): (a: ScoredRepo, b: ScoredRepo) => number {
  if (view.sort === "stars") return (a, b) => b.repo.stars - a.repo.stars;
  if (view.sort === "recent") return (a, b) => Date.parse(b.repo.pushedAt) - Date.parse(a.repo.pushedAt);
  return (a, b) => b.score - a.score;
}

/** Filters and sorts a page of results in the browser. No GitHub calls. */
export function applyView(items: ScoredRepo[], view: ResultsView): ScoredRepo[] {
  return items.filter((item) => passes(item, view)).sort(compare(view));
}
