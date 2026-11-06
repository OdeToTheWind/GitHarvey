import { describe, expect, it } from "vitest";
import { abandonedNote, countPackageJson, countRequirements, describeMergeTime, medianMergeDays, sizeTag, trendOf } from "@/lib/insights";
import type { RepoSummary } from "@/types";

const NOW = Date.parse("2026-11-02T00:00:00Z");
const repo: RepoSummary = {
  id: 1, fullName: "a/b", description: null, url: "https://github.com/a/b", stars: 10, forks: 1, openIssues: 2,
  language: "Go", license: "MIT", pushedAt: "2026-10-20T00:00:00Z", createdAt: "2020-01-01T00:00:00Z",
  topics: [], archived: false, homepage: null, sizeKb: 500,
};
const pr = (days: number | null) => ({ createdAt: "2026-01-01T00:00:00Z", mergedAt: days === null ? null : new Date(Date.parse("2026-01-01T00:00:00Z") + days * 86_400_000).toISOString() });

describe("medianMergeDays", () => {
  it("takes the median of merged pull requests and ignores unmerged ones", () => {
    expect(medianMergeDays([pr(1), pr(3), pr(10), pr(null)])).toEqual({ medianDays: 3, sampled: 3 });
    expect(medianMergeDays([pr(1), pr(2), pr(4), pr(9)])).toEqual({ medianDays: 3, sampled: 4 });
  });
  it("needs a few merged samples before it says anything", () => {
    expect(medianMergeDays([pr(1), pr(2), pr(null)])).toBeNull();
    expect(medianMergeDays([])).toBeNull();
  });
  it("describes short and long times", () => {
    expect(describeMergeTime(0.25)).toBe("6 hours");
    expect(describeMergeTime(0.001)).toBe("1 hours");
    expect(describeMergeTime(2.46)).toBe("2.5 days");
  });
});

describe("trendOf", () => {
  const weeks = (earlier: number, recent: number) => [...Array(26).fill(0), ...Array(13).fill(earlier), ...Array(13).fill(recent)];
  it("compares the last 13 weeks with the 13 before", () => {
    expect(trendOf(weeks(2, 5))).toBe("rising");
    expect(trendOf(weeks(5, 2))).toBe("declining");
    expect(trendOf(weeks(4, 4))).toBe("steady");
    expect(trendOf(weeks(0, 0))).toBe("quiet");
  });
  it("is unknown without enough data", () => {
    expect(trendOf(null)).toBeNull();
    expect(trendOf([1, 2, 3])).toBeNull();
  });
});

describe("abandonedNote", () => {
  it("flags archived repos and repos with no push in a year", () => {
    expect(abandonedNote({ ...repo, archived: true }, NOW)).toMatch(/Archived/);
    expect(abandonedNote({ ...repo, pushedAt: "2025-01-01T00:00:00Z" }, NOW)).toMatch(/abandoned/);
    expect(abandonedNote(repo, NOW)).toBeNull();
  });
});

describe("sizeTag", () => {
  it("prefers starter topics, then buckets by size", () => {
    expect(sizeTag({ ...repo, topics: ["boilerplate"], sizeKb: 90_000 })).toBe("Starter or example");
    expect(sizeTag({ ...repo, sizeKb: 500 })).toBe("Small codebase");
    expect(sizeTag({ ...repo, sizeKb: 5_000 })).toBe("Medium codebase");
    expect(sizeTag({ ...repo, sizeKb: 90_000 })).toBe("Large codebase");
    expect(sizeTag({ ...repo, sizeKb: 0 })).toBeNull();
  });
});

describe("dependency counting", () => {
  it("counts package.json dependencies, not devDependencies", () => {
    expect(countPackageJson('{"dependencies":{"a":"1","b":"2"},"devDependencies":{"c":"3"}}')).toBe(2);
    expect(countPackageJson("{}")).toBe(0);
    expect(countPackageJson("not json")).toBeNull();
    expect(countPackageJson("[1]")).toBe(0);
  });
  it("counts requirements lines and skips comments, blanks and options", () => {
    expect(countRequirements("# c\nflask==2\n\n-r other.txt\nrequests>=2\n")).toBe(2);
  });
});
