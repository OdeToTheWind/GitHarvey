import type { RepoExtras, ScoredRepo } from "@/types";
import { bestIndexes, pushedTimes, releaseTimes } from "./compare";
import type { ExportTable } from "./compare-export";
import { factsFor } from "./facts";
import { ago } from "./format";
import { healthLabel } from "./score";

export type Extras = (RepoExtras | null)[];

export interface CompareRow {
  label: string;
  text: (r: ScoredRepo, extras: RepoExtras | null) => string;
  /** Which columns hold the best value (ties included). A tie is not shown as a win. */
  best?: (items: ScoredRepo[], extras: Extras) => Set<number>;
  /** Rows drawn with a badge or a link in the table; exports use the plain text. */
  kind?: "badge" | "link";
  /** True for facts that come from the slower extra lookups. Big comparisons leave these rows out. */
  needsExtras?: boolean;
}

const num = (n: number) => n.toLocaleString("en-US");
const fact = (label: string): CompareRow["text"] => (r, extras) =>
  factsFor(r.repo, r.health, extras).find((f) => f.label === label)?.value ?? "Not available";
const factRow = (label: string, best?: CompareRow["best"], needsExtras = false): CompareRow => ({ label, text: fact(label), best, needsExtras });

export const COMPARE_ROWS: CompareRow[] = [
  { label: "Score", kind: "badge", text: (r) => `${healthLabel(r)} ${r.score}`, best: (i) => bestIndexes(i.map((r) => r.score)) },
  { label: "Description", text: (r) => r.repo.description ?? "None" },
  { label: "Stars", text: (r) => num(r.repo.stars), best: (i) => bestIndexes(i.map((r) => r.repo.stars)) },
  { label: "Forks", text: (r) => num(r.repo.forks), best: (i) => bestIndexes(i.map((r) => r.repo.forks)) },
  factRow("Open issues and PRs"),
  { label: "Language", text: (r) => r.repo.language ?? "Not set" },
  { label: "License", text: (r) => r.repo.license ?? "None found" },
  factRow("License type"),
  factRow("Codebase size"),
  factRow("Age"),
  { label: "Last pushed", text: (r) => ago(r.repo.pushedAt), best: (i) => bestIndexes(pushedTimes(i)) },
  { label: "Last release", text: (r) => ago(r.health.lastReleaseAt), best: (i) => bestIndexes(releaseTimes(i)) },
  factRow("Contributors", (_, e) => bestIndexes(e.map((x) => x?.contributors ?? null)), true),
  factRow("Median time to merge a PR", (_, e) => bestIndexes(e.map((x) => x?.mergeSpeed?.medianDays ?? null), "min"), true),
  factRow("Maintenance trend", undefined, true),
  factRow("Good first issues", undefined, true),
  factRow("Dependencies (approx.)", (_, e) => bestIndexes(e.map((x) => x?.dependencies?.count ?? null), "min"), true),
  { label: "Topics", text: (r) => r.repo.topics.slice(0, 5).join(", ") || "None" },
  { label: "Archived", text: (r) => (r.repo.archived ? "Yes" : "No") },
  { label: "Link", kind: "link", text: (r) => r.repo.url },
];

/** The rows to show. A "lite" comparison (many repos) leaves out the facts that need the slower lookups. */
export function rowsFor(lite: boolean): CompareRow[] {
  return lite ? COMPARE_ROWS.filter((row) => !row.needsExtras) : COMPARE_ROWS;
}

/** The same rows as plain text, for Markdown and CSV. */
export function exportTable(items: ScoredRepo[], extras: Extras, lite = false): ExportTable {
  return {
    heads: ["", ...items.map((r) => r.repo.fullName)],
    rows: rowsFor(lite).map((row) => ({ label: row.label, cells: items.map((r, i) => row.text(r, extras[i] ?? null)) })),
  };
}
