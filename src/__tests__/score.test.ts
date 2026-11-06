import { describe, expect, it } from "vitest";
import { buildSearchQuery, searchSort } from "@/lib/query";
import { PROFILES } from "@/lib/profiles";
import { scoreRepo } from "@/lib/score";
import type { Preferences, RepoSummary } from "@/types";

const NOW = Date.parse("2026-11-02T00:00:00Z");
const base: RepoSummary = {
  id: 1, fullName: "a/b", description: "d", url: "https://github.com/a/b",
  stars: 100000, forks: 10, openIssues: 20, language: "Go", license: "MIT",
  pushedAt: "2026-10-20T00:00:00Z", createdAt: "2020-01-01T00:00:00Z",
  topics: ["x"], archived: false, homepage: "https://x.dev", sizeKb: 800,
};
const dev: { audience: "developer"; priorities: never[] } = { audience: "developer", priorities: [] };
const score = (r: Partial<RepoSummary>, release: string | null = null, p: Parameters<typeof scoreRepo>[2] = dev) =>
  scoreRepo({ ...base, ...r }, { lastReleaseAt: release }, p, NOW);

describe("scoreRepo", () => {
  it("weights sum to 1 for every audience", () => {
    for (const w of Object.values(PROFILES)) {
      expect(w.recency + w.license + w.docs + w.popularity).toBeCloseTo(1);
    }
  });
  it("rates an active, licensed, popular repo green and caps at 100", () => {
    const r = score({}, "2026-09-01T00:00:00Z");
    expect(r.badge).toBe("green");
    expect(r.score).toBeLessThanOrEqual(100);
  });
  it("scores recency in steps", () => {
    const at = (iso: string) => score({ pushedAt: iso }).score;
    expect(at("2026-10-20T00:00:00Z")).toBeGreaterThan(at("2026-07-01T00:00:00Z"));
    expect(at("2026-07-01T00:00:00Z")).toBeGreaterThan(at("2026-03-01T00:00:00Z"));
    expect(at("2026-03-01T00:00:00Z")).toBeGreaterThan(at("2020-01-01T00:00:00Z"));
  });
  it("treats a future pushedAt as today", () => {
    expect(score({ pushedAt: "2030-01-01T00:00:00Z" }).score).toBe(score({}).score);
  });
  it("handles zero stars", () => {
    expect(score({ stars: 0 }).score).toBeLessThan(score({}).score);
  });
  it("penalizes a missing license", () => {
    const r = score({ license: null });
    expect(r.score).toBeLessThan(score({}).score);
    expect(r.reasons).toContain("No license");
  });
  it("halves non-permissive licenses only with the permissive priority", () => {
    const gpl = { license: "GPL-3.0" };
    const plain = score(gpl).score;
    const strict = score(gpl, null, { audience: "developer", priorities: ["permissive-license"] }).score;
    expect(strict).toBeLessThan(plain);
    expect(score({ license: "MIT" }, null, { audience: "developer", priorities: ["permissive-license"] }).score).toBe(score({}).score);
  });
  it("adds a release bonus only within a year, missing release is neutral", () => {
    const none = score({ stars: 10 }).score;
    expect(score({ stars: 10 }, "2026-09-01T00:00:00Z").score).toBeGreaterThan(none);
    expect(score({ stars: 10 }, "2020-01-01T00:00:00Z").score).toBe(none);
  });
  it("caps archived repos at 20 and red", () => {
    const r = score({ archived: true }, "2026-09-01T00:00:00Z");
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.badge).toBe("red");
    expect(r.reasons[0]).toBe("Archived");
  });
  it("uses 2-4 reasons and the badge thresholds", () => {
    const r = score({});
    expect(r.reasons.length).toBeGreaterThanOrEqual(2);
    expect(r.reasons.length).toBeLessThanOrEqual(4);
    expect(score({ stars: 0, license: null, homepage: null, pushedAt: "2019-01-01T00:00:00Z" }).badge).toBe("red");
  });
  it("explains every point in the breakdown", () => {
    const r = score({ stars: 5000 }, "2026-09-01T00:00:00Z");
    expect(r.breakdown.map((l) => l.label)).toEqual(["Recent activity", "License", "Docs", "Popularity", "Release bonus"]);
    const sum = r.breakdown.reduce((n, l) => n + l.points, 0);
    expect(Math.abs(sum - r.score)).toBeLessThanOrEqual(1);
    expect(r.breakdown.every((l) => l.points <= l.max)).toBe(true);
  });
  it("never scores above 100 even when the signals add up to more", () => {
    const r = score({}, "2026-09-01T00:00:00Z");
    expect(r.breakdown.reduce((n, l) => n + l.points, 0)).toBeGreaterThan(100);
    expect(r.score).toBe(100);
  });
  it("says when the release was not checked yet", () => {
    const r = scoreRepo({ ...base }, { lastReleaseAt: null, checked: false }, dev, NOW);
    expect(r.breakdown.at(-1)?.detail).toMatch(/Not checked/);
  });
  it("learn goal favours docs over popularity", () => {
    const noDocs = { homepage: null, stars: 100000 };
    const learn = scoreRepo({ ...base, ...noDocs }, { lastReleaseAt: null }, { audience: "developer", priorities: [], goal: "learn" }, NOW).score;
    expect(learn).toBeLessThan(score(noDocs).score);
  });
});

describe("buildSearchQuery", () => {
  const prefs = (p: Partial<Preferences>): Preferences => ({ audience: "developer", goal: "build", topic: "pdf", priorities: [], ...p });
  const now = new Date("2026-11-02T00:00:00Z");
  it("returns empty for an empty topic", () => {
    expect(buildSearchQuery(prefs({ topic: "  " }), now)).toBe("");
  });
  it("always excludes archived repos", () => {
    expect(buildSearchQuery(prefs({}), now)).toBe("pdf archived:false stars:>10");
  });
  it("strips qualifier characters", () => {
    expect(buildSearchQuery(prefs({ topic: 'user:evil "x"' }), now).startsWith("user evil x")).toBe(true);
  });
  it("keeps c++ and node.js", () => {
    expect(buildSearchQuery(prefs({ topic: "c++ node.js" }), now)).toContain("c++ node.js");
  });
  it("adds language", () => {
    expect(buildSearchQuery(prefs({ language: "cpp" }), now)).toContain("language:C++");
    expect(buildSearchQuery(prefs({ language: "csharp" }), now)).toContain("language:C#");
  });
  it("adds maintained as a 365-day pushed filter", () => {
    expect(buildSearchQuery(prefs({ priorities: ["maintained"] }), now)).toContain("pushed:>2025-11-02");
  });
  it("adds popular as stars:>100 instead of the default floor", () => {
    const q = buildSearchQuery(prefs({ priorities: ["popular"] }), now);
    expect(q).toContain("stars:>100");
    expect(q).not.toContain("stars:>10 ");
  });
  it("turns beginner-friendly into a good-first-issues filter", () => {
    expect(buildSearchQuery(prefs({ priorities: ["beginner-friendly"] }), now)).toContain("good-first-issues:>0");
  });
  it("sorts by updated only for the stay-updated goal", () => {
    expect(searchSort(prefs({ goal: "stay-updated" }))).toBe("updated");
    expect(searchSort(prefs({ goal: "build" }))).toBeUndefined();
  });
  it("leaves permissive-license to scoring", () => {
    expect(buildSearchQuery(prefs({ priorities: ["permissive-license"] }), now)).toBe("pdf archived:false stars:>10");
  });
});
