import type { RepoExtras, RepoHealth, RepoSummary } from "@/types";
import { age, ago } from "./format";
import { describeMergeTime, sizeTag, TREND_LABELS, trendOf } from "./insights";
import { LICENSE_LABELS, LICENSE_NOTES, licenseKind } from "./licenses";

export interface Fact {
  label: string;
  value: string;
  note?: string;
}

export const NOT_LOADED = "Not loaded yet";
const num = (n: number) => n.toLocaleString("en-US");

function loaded<T>(extras: RepoExtras | null, read: (e: RepoExtras) => T | null, show: (v: T) => string): string {
  if (!extras) return NOT_LOADED;
  const value = read(extras);
  return value === null ? "Not available" : show(value);
}

/**
 * Facts that help you judge a repo but are NOT part of its score. The same list feeds the
 * card, the detail page and the compare table, so the wording never drifts.
 */
export function factsFor(repo: RepoSummary, health: RepoHealth, extras: RepoExtras | null): Fact[] {
  const kind = licenseKind(repo.license);
  const merge = (e: RepoExtras) => e.mergeSpeed;
  return [
    { label: "Open issues and PRs", value: num(repo.openIssues) },
    { label: "License type", value: LICENSE_LABELS[kind], note: `${LICENSE_NOTES[kind]} Information only, not legal advice.` },
    { label: "Codebase size", value: sizeTag(repo) ?? "Unknown", note: "A rough guide, from the repository size on GitHub." },
    { label: "Age", value: age(repo.createdAt) },
    { label: "Last release", value: health.checked === false ? NOT_LOADED : ago(health.lastReleaseAt) },
    { label: "Contributors", value: loaded(extras, (e) => e.contributors, num) },
    {
      label: "Median time to merge a PR",
      value: loaded(extras, merge, (m) => `${describeMergeTime(m.medianDays)} (last ${m.sampled} merged)`),
    },
    {
      label: "Maintenance trend",
      value: loaded(extras, (e) => trendOf(e.weeklyCommits), (t) => TREND_LABELS[t]),
      note: "Commits in the last 13 weeks compared with the 13 before.",
    },
    { label: "Good first issues", value: loaded(extras, (e) => e.goodFirstIssues, (n) => `${num(n)} open`) },
    {
      label: "Dependencies (approx.)",
      value: loaded(extras, (e) => e.dependencies, (d) => `${num(d.count)} in ${d.file}`),
      note: "Counted from package.json or requirements.txt at the top level only.",
    },
  ];
}
