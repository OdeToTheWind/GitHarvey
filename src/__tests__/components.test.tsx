import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { scoreRepo } from "@/lib/score";
import type { Preferences, RepoSummary } from "@/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, refresh: () => {} }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => createElement("a", { href, ...rest }, children),
}));

import { CompareTable } from "@/components/CompareTable";
import { ResultCard } from "@/components/ResultCard";
import { ResultsList } from "@/components/ResultsList";

const NOW = Date.now();
const repo = (n: number, extra: Partial<RepoSummary> = {}): RepoSummary => ({
  id: n, fullName: `owner/repo${n}`, description: `Repo number ${n}`, url: `https://github.com/owner/repo${n}`,
  stars: 1000 * n, forks: 5, openIssues: 3, language: "Go", license: "MIT",
  pushedAt: new Date(NOW - 5 * 86400000).toISOString(), createdAt: "2020-01-01T00:00:00Z",
  topics: ["a"], archived: false, homepage: null, ...extra,
});
const prefs: Preferences = { audience: "developer", goal: "build", topic: "pdf", priorities: [] };
const scored = (n: number, extra: Partial<RepoSummary> = {}) => scoreRepo(repo(n, extra), { lastReleaseAt: null, checked: false }, prefs);

describe("ResultCard", () => {
  const html = renderToStaticMarkup(createElement(ResultCard, { item: scored(1), scoring: prefs, selected: false, canSelect: true, onToggle: () => {} }));
  it("shows the score and its working", () => {
    expect(html).toContain("owner/repo1");
    expect(html).toContain("Why this score");
    expect(html).toContain("Recent activity");
  });
  it("opens external links safely", () => {
    expect(html).toContain('rel="noopener noreferrer"');
  });
});

describe("ResultsList", () => {
  const many = Array.from({ length: 25 }, (_, i) => scored(i + 1));
  it("shows 10 first and offers more", () => {
    const html = renderToStaticMarkup(createElement(ResultsList, { results: many, prefs }));
    expect(html).toContain("Showing 10 of 25");
    expect(html).toContain("Show 10 more");
    expect((html.match(/<article/g) ?? []).length).toBe(10);
  });
  it("explains an empty result and how to fix it", () => {
    const html = renderToStaticMarkup(createElement(ResultsList, { results: [], prefs: { ...prefs, language: "go", priorities: ["popular"] } }));
    expect(html).toContain("No repos found for");
    expect(html).toContain("Remove the language filter");
    expect(html).toContain("Change answers");
  });
  it("pre-ticks the top three for the compare goal", () => {
    const html = renderToStaticMarkup(createElement(ResultsList, { results: many, prefs: { ...prefs, goal: "compare" } }));
    expect(html).toContain("Compare (3)");
  });
});

describe("CompareTable", () => {
  it("marks the best value in a row", () => {
    const html = renderToStaticMarkup(createElement(CompareTable, { items: [scored(1), scored(2)] }));
    expect(html).toContain("best");
    expect(html).toContain("owner/repo2");
  });
});

describe("CompareTable ties", () => {
  it("does not mark a tie as best", () => {
    const a = scored(1);
    const b = { ...scored(1), repo: { ...scored(1).repo, id: 99, stars: 1000 } };
    const html = renderToStaticMarkup(createElement(CompareTable, { items: [a, b] }));
    expect(html).not.toContain(">best<");
  });
});
