import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { scoreRepo } from "@/lib/score";
import type { Preferences, RepoExtras, RepoSummary } from "@/types";

const saved = vi.hoisted(() => ({ names: [] as string[] }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, refresh: () => {} }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => createElement("a", { href, ...rest }, children),
}));
vi.mock("@/lib/use-stored", () => ({ useStoredPrefs: () => null, useShortlist: () => saved.names }));

import { CompareTable } from "@/components/CompareTable";
import { Header } from "@/components/Header";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ResultCard } from "@/components/ResultCard";
import { ResultsToolbar } from "@/components/ResultsToolbar";
import { SavedList } from "@/components/SavedList";
import { WeightSliders } from "@/components/WeightSliders";
import { DEFAULT_VIEW } from "@/lib/results-view";

const NOW = Date.now();
const repo = (n: number, extra: Partial<RepoSummary> = {}): RepoSummary => ({
  id: n, fullName: `owner/repo${n}`, description: `Repo ${n}`, url: `https://github.com/owner/repo${n}`, stars: 1000 * n, forks: 5, openIssues: 3,
  language: "Go", license: "MIT", pushedAt: new Date(NOW - 5 * 86_400_000).toISOString(), createdAt: "2020-01-01T00:00:00Z", topics: [], archived: false, homepage: null, sizeKb: 800, ...extra,
});
const prefs: Preferences = { audience: "developer", goal: "build", topic: "pdf", priorities: [] };
const scored = (n: number, extra: Partial<RepoSummary> = {}) => scoreRepo(repo(n, extra), { lastReleaseAt: null, checked: true }, prefs);
const extras = (merge: number | null, contributors: number | null): RepoExtras => ({
  mergeSpeed: merge === null ? null : { medianDays: merge, sampled: 12 },
  contributors,
  weeklyCommits: [...Array(39).fill(1), ...Array(13).fill(5)],
  goodFirstIssues: 3,
  dependencies: { count: 4, file: "package.json" },
});
const card = (item: ReturnType<typeof scored>) =>
  renderToStaticMarkup(createElement(ResultCard, { item, scoring: prefs, selected: false, onToggle: () => {} }));

describe("result card labels", () => {
  it("shows the license type and a size hint without any extra GitHub call", () => {
    const html = card(scored(1));
    expect(html).toContain("Permissive");
    expect(html).toContain("Small codebase");
  });
  it("warns about an archived repo in plain words and offers alternatives", () => {
    const html = card(scored(2, { archived: true, license: null }));
    expect(html).toContain("Archived by its owner");
    expect(html).toContain("No license");
    expect(html).toContain("Find alternatives");
    expect(html).toContain("not=owner%2Frepo2");
  });
  it("does not offer alternatives for a healthy repo", () => {
    expect(card(scored(1))).not.toContain("Find alternatives");
  });
  it("makes the repo name a heading", () => {
    expect(card(scored(1))).toMatch(/<h2[^>]*><a[^>]*>owner\/repo1<\/a><\/h2>/);
  });
});

describe("InsightsPanel", () => {
  it("lists the facts, says they do not change the score, and draws the trend", () => {
    const html = renderToStaticMarkup(createElement(InsightsPanel, { item: scored(1), extras: extras(2.5, 42) }));
    expect(html).toContain("None of this changes the score");
    expect(html).toContain("42");
    expect(html).toContain("2.5 days (last 12 merged)");
    expect(html).toContain("Rising");
    expect(html).toContain('role="img"');
    expect(html).toContain("3 open");
    expect(html).toContain("4 in package.json");
  });
  it("says what is missing instead of guessing", () => {
    const html = renderToStaticMarkup(createElement(InsightsPanel, { item: scored(1), extras: extras(null, null) }));
    expect(html).toContain("Not available");
    expect(renderToStaticMarkup(createElement(InsightsPanel, { item: scored(1), extras: null }))).toContain("Not loaded yet");
  });
});

describe("CompareTable extras", () => {
  const html = renderToStaticMarkup(createElement(CompareTable, { items: [scored(1), scored(2)], extras: [extras(2, 10), extras(9, 50)] }));
  it("adds the new rows", () => {
    for (const label of ["Median time to merge a PR", "Contributors", "Maintenance trend", "License type", "Codebase size", "Age", "Good first issues", "Dependencies (approx.)"]) {
      expect(html, label).toContain(label);
    }
  });
  it("is labelled for screen readers", () => {
    expect(html).toContain("Side-by-side comparison of owner/repo1, owner/repo2");
  });
  it("still renders when extras are missing", () => {
    expect(renderToStaticMarkup(createElement(CompareTable, { items: [scored(1), scored(2)] }))).toContain("Not loaded yet");
  });
});

describe("toolbar and sliders", () => {
  it("labels every control", () => {
    const html = renderToStaticMarkup(createElement(ResultsToolbar, { view: DEFAULT_VIEW, onChange: () => {} }));
    for (const label of ["Sort by", "License", "Minimum stars"]) expect(html).toContain(label);
    expect(html).toContain("Permissive only");
  });
  it("shows one slider per signal and warns when all are zero", () => {
    const w = { recency: 4, license: 3, docs: 3, popularity: 6 };
    const html = renderToStaticMarkup(createElement(WeightSliders, { value: w, tuned: false, allZero: false, onChange: () => {}, onReset: () => {} }));
    expect((html.match(/type="range"/g) ?? []).length).toBe(4);
    expect(html).not.toContain("Set at least one");
    const zero = renderToStaticMarkup(createElement(WeightSliders, { value: { recency: 0, license: 0, docs: 0, popularity: 0 }, tuned: true, allZero: true, onChange: () => {}, onReset: () => {} }));
    expect(zero).toContain("Set at least one signal above 0");
    expect(zero).toContain("(custom)");
  });
});

describe("saved repos", () => {
  it("shows the count in the header only when something is saved", () => {
    saved.names = [];
    expect(renderToStaticMarkup(<Header hasToken={false} repo={null} />)).not.toContain("Saved (");
    saved.names = ["a/b", "c/d"];
    expect(renderToStaticMarkup(<Header hasToken={false} repo={null} />)).toContain("Saved (2)");
  });
  it("lists saved repos with links to their details and a compare button", () => {
    saved.names = ["a/b", "c/d"];
    const html = renderToStaticMarkup(createElement(SavedList));
    expect(html).toContain('href="/repo/a/b');
    expect(html).toContain("Compare (0)");
    saved.names = [];
    expect(renderToStaticMarkup(createElement(SavedList))).toContain("Nothing saved yet");
  });
});

describe("Sign in with GitHub", () => {
  it("is a real link to the sign-in route and remembers where to go back to", async () => {
    const { SignInLink } = await import("@/components/SignInLink");
    const html = renderToStaticMarkup(createElement(SignInLink, { next: "/finder?q=pdf" }));
    expect(html).toContain('href="/api/auth/github?next=%2Ffinder%3Fq%3Dpdf"');
    expect(html).toContain("Sign in with GitHub");
  });
  it("sits in the navbar when signed out, and is replaced by Sign out when signed in", () => {
    const out = renderToStaticMarkup(<Header hasToken={false} repo={null} />);
    expect(out).toContain('href="/api/auth/github"');
    expect(out).toContain("Sign in with GitHub");
    expect(out).not.toContain("Sign out");
    const inn = renderToStaticMarkup(<Header hasToken repo={null} />);
    expect(inn).toContain("Sign out");
    expect(inn).not.toContain("Sign in with GitHub");
  });
  it("asks for sign-in where GitHub data is needed, and never asks for a token", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "id");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "secret");
    const { SignInCard } = await import("@/components/SignInCard");
    const html = renderToStaticMarkup(createElement(SignInCard, { reason: "Comparing needs GitHub.", next: "/compare" }));
    expect(html).toContain("Comparing needs GitHub.");
    expect(html).toContain('href="/api/auth/github?next=%2Fcompare"');
    expect(html).not.toMatch(/paste|personal access token/i);
    vi.unstubAllEnvs();
  });
  it("says where to put the client id and secret while developing, and offers no working link", async () => {
    vi.stubEnv("GITHUB_CLIENT_ID", "");
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");
    vi.stubEnv("NODE_ENV", "development");
    const { SignInCard } = await import("@/components/SignInCard");
    const html = renderToStaticMarkup(createElement(SignInCard, { reason: "x" }));
    for (const text of ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", ".env.local"]) expect(html).toContain(text);
    expect(html).not.toContain("/api/auth/github");
    vi.stubEnv("NODE_ENV", "production");
    const prod = renderToStaticMarkup(createElement(SignInCard, { reason: "x" }));
    expect(prod).toContain("not set up on this site yet");
    expect(prod).not.toContain("GITHUB_CLIENT_SECRET");
    vi.unstubAllEnvs();
  });
});

describe("comparing up to 10", () => {
  it("allows ten checkboxes to be ticked and explains the limit in one place", async () => {
    const { MAX_COMPARE, TOO_MANY_MESSAGE } = await import("@/lib/compare");
    expect(MAX_COMPARE).toBe(10);
    expect(TOO_MANY_MESSAGE).toContain("up to 10 repos");
    const html = renderToStaticMarkup(createElement(ResultCard, { item: scored(1), scoring: prefs, selected: false, onToggle: () => {} }));
    expect(html).not.toMatch(/<input[^>]*type="checkbox"[^>]*disabled/);
  });
  it("shows how many can be compared next to the button", async () => {
    const { ResultsList } = await import("@/components/ResultsList");
    const html = renderToStaticMarkup(createElement(ResultsList, { results: [scored(1), scored(2)], prefs: { ...prefs, goal: "compare" } }));
    expect(html).toContain("Compare (2)");
    expect(html).toContain("up to 10");
    expect(html).not.toContain('role="alert"');
  });
  it("drops the slower facts from a big comparison, in the table and in the exports", async () => {
    const { rowsFor, exportTable } = await import("@/lib/compare-rows");
    const labels = rowsFor(true).map((r) => r.label);
    for (const gone of ["Contributors", "Median time to merge a PR", "Maintenance trend", "Good first issues", "Dependencies (approx.)"]) expect(labels).not.toContain(gone);
    for (const kept of ["Score", "Stars", "License type", "Last release"]) expect(labels).toContain(kept);
    const items = [scored(1), scored(2)];
    expect(exportTable(items, [], true).rows.map((r) => r.label)).not.toContain("Contributors");
    expect(exportTable(items, [], false).rows.map((r) => r.label)).toContain("Contributors");
    const html = renderToStaticMarkup(createElement(CompareTable, { items, lite: true }));
    expect(html).not.toContain("Contributors");
    expect(html).toContain("Stars");
  });
  it("makes room for many columns", () => {
    const items = Array.from({ length: 10 }, (_, i) => scored(i + 1));
    expect(renderToStaticMarkup(createElement(CompareTable, { items, lite: true }))).toContain("min-width:120rem");
  });
});
