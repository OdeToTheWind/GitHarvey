import { describe, expect, it } from "vitest";
import { applyView, DEFAULT_VIEW } from "@/lib/results-view";
import { scoreRepo } from "@/lib/score";
import { importanceFromWeights, weightsFromImportance } from "@/lib/weights";
import { weightsFor } from "@/lib/profiles";
import type { RepoSummary } from "@/types";

const NOW = Date.parse("2026-11-02T00:00:00Z");
const make = (id: number, extra: Partial<RepoSummary>) =>
  scoreRepo(
    { id, fullName: `o/r${id}`, description: null, url: "https://github.com/o/r", stars: 100, forks: 1, openIssues: 0, language: "Go", license: "MIT",
      pushedAt: "2026-10-20T00:00:00Z", createdAt: "2020-01-01T00:00:00Z", topics: [], archived: false, homepage: null, sizeKb: 10, ...extra },
    { lastReleaseAt: null },
    undefined,
    NOW,
  );
const items = [
  make(1, { stars: 50, license: "GPL-3.0", pushedAt: "2026-01-01T00:00:00Z" }),
  make(2, { stars: 5000, license: null, pushedAt: "2026-06-01T00:00:00Z" }),
  make(3, { stars: 900, license: "MIT", pushedAt: "2026-10-30T00:00:00Z" }),
];
const names = (list: typeof items) => list.map((i) => i.repo.id);

describe("applyView", () => {
  it("sorts without changing the input", () => {
    expect(names(applyView(items, { ...DEFAULT_VIEW, sort: "stars" }))).toEqual([2, 3, 1]);
    expect(names(applyView(items, { ...DEFAULT_VIEW, sort: "recent" }))).toEqual([3, 2, 1]);
    expect(names(items)).toEqual([1, 2, 3]);
  });
  it("sorts by score by default", () => {
    const sorted = applyView(items, DEFAULT_VIEW);
    expect(sorted.map((i) => i.score)).toEqual([...sorted.map((i) => i.score)].sort((a, b) => b - a));
  });
  it("filters by license and stars", () => {
    expect(names(applyView(items, { ...DEFAULT_VIEW, license: "licensed", sort: "stars" }))).toEqual([3, 1]);
    expect(names(applyView(items, { ...DEFAULT_VIEW, license: "permissive" }))).toEqual([3]);
    expect(names(applyView(items, { ...DEFAULT_VIEW, minStars: 1000 }))).toEqual([2]);
  });
});

describe("custom weights", () => {
  it("turns slider values into weights that sum to 1", () => {
    const w = weightsFromImportance({ recency: 5, license: 0, docs: 5, popularity: 0 });
    expect(w).toEqual({ recency: 0.5, license: 0, docs: 0.5, popularity: 0 });
    expect(weightsFromImportance({ recency: 0, license: 0, docs: 0, popularity: 0 })).toBeNull();
  });
  it("starts the sliders near the audience defaults", () => {
    const start = importanceFromWeights(weightsFor("developer"));
    const back = weightsFromImportance(start);
    expect(back?.recency).toBeGreaterThan(back?.docs ?? 1);
  });
  it("changes the score the same way the weights say", () => {
    const repo = { id: 9, fullName: "o/x", description: null, url: "u", stars: 3, forks: 0, openIssues: 0, language: null, license: null,
      pushedAt: "2026-10-30T00:00:00Z", createdAt: "2020-01-01T00:00:00Z", topics: [], archived: false, homepage: null, sizeKb: 1 };
    const recencyOnly = scoreRepo(repo, { lastReleaseAt: null }, { audience: "developer", priorities: [], weights: { recency: 1, license: 0, docs: 0, popularity: 0 } }, NOW);
    expect(recencyOnly.score).toBe(100);
  });
});
