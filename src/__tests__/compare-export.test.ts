import { describe, expect, it } from "vitest";
import { csvCell, toCsv, toMarkdown } from "@/lib/compare-export";
import { COMPARE_ROWS, exportTable } from "@/lib/compare-rows";
import { scoreRepo } from "@/lib/score";
import type { RepoExtras, RepoSummary } from "@/types";

const NOW = Date.parse("2026-11-02T00:00:00Z");
const repo = (id: number, extra: Partial<RepoSummary> = {}): RepoSummary => ({
  id, fullName: `o/r${id}`, description: `Repo ${id}`, url: `https://github.com/o/r${id}`, stars: 10 * id, forks: id, openIssues: id, language: "Go", license: "MIT",
  pushedAt: "2026-10-20T00:00:00Z", createdAt: "2020-01-01T00:00:00Z", topics: [], archived: false, homepage: null, sizeKb: 100, ...extra,
});
const extras = (merge: number | null, contributors: number | null): RepoExtras => ({
  mergeSpeed: merge === null ? null : { medianDays: merge, sampled: 10 }, contributors, weeklyCommits: null, goodFirstIssues: 4, dependencies: { count: 7, file: "package.json" },
});

describe("csvCell", () => {
  it("quotes commas and quotes, and flattens line breaks", () => {
    expect(csvCell('a, "b"\nc')).toBe('"a, ""b"" c"');
  });
  it("defuses spreadsheet formulas", () => {
    for (const evil of ["=HYPERLINK(\"x\")", "+1+1", "-2", "@SUM(A1)"]) {
      expect(csvCell(evil).replace(/^"/, "")).toMatch(/^'/);
    }
  });
});

describe("exports", () => {
  const items = [scoreRepo(repo(1), { lastReleaseAt: null }, undefined, NOW), scoreRepo(repo(2, { description: "a | b" }), { lastReleaseAt: null }, undefined, NOW)];
  const table = exportTable(items, [extras(2, 10), extras(null, null)]);

  it("keeps one row per compare row, with a cell per repo", () => {
    expect(table.rows).toHaveLength(COMPARE_ROWS.length);
    expect(table.heads).toEqual(["", "o/r1", "o/r2"]);
    expect(table.rows.every((r) => r.cells.length === 2)).toBe(true);
  });
  it("shows what is missing instead of inventing it", () => {
    const merge = table.rows.find((r) => r.label === "Median time to merge a PR");
    expect(merge?.cells).toEqual(["2 days (last 10 merged)", "Not available"]);
  });
  it("makes a Markdown table that survives a pipe in the text", () => {
    const md = toMarkdown(table);
    expect(md.split("\n")[1]).toBe("| --- | --- | --- |");
    expect(md).toContain("a \\| b");
  });
  it("makes a CSV with a header and the same rows", () => {
    expect(toCsv(table).split("\n")).toHaveLength(COMPARE_ROWS.length + 1);
  });
});
