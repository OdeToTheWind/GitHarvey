import { bestIndexes, pushedTimes, releaseTimes } from "@/lib/compare";
import { ago } from "@/lib/format";
import type { ScoredRepo } from "@/types";
import { HealthBadge } from "./HealthBadge";

interface Row {
  label: string;
  show: (r: ScoredRepo) => React.ReactNode;
  best?: (items: ScoredRepo[]) => Set<number>;
}

const num = (n: number) => n.toLocaleString("en-US");

const ROWS: Row[] = [
  { label: "Score", show: (r) => <HealthBadge item={r} />, best: (i) => bestIndexes(i.map((r) => r.score)) },
  { label: "Description", show: (r) => r.repo.description ?? "None" },
  { label: "Stars", show: (r) => num(r.repo.stars), best: (i) => bestIndexes(i.map((r) => r.repo.stars)) },
  { label: "Forks", show: (r) => num(r.repo.forks), best: (i) => bestIndexes(i.map((r) => r.repo.forks)) },
  { label: "Open issues", show: (r) => num(r.repo.openIssues) },
  { label: "Language", show: (r) => r.repo.language ?? "Not set" },
  { label: "License", show: (r) => r.repo.license ?? "None found" },
  { label: "Last pushed", show: (r) => ago(r.repo.pushedAt), best: (i) => bestIndexes(pushedTimes(i)) },
  { label: "Last release", show: (r) => ago(r.health.lastReleaseAt), best: (i) => bestIndexes(releaseTimes(i)) },
  { label: "Topics", show: (r) => r.repo.topics.slice(0, 5).join(", ") || "None" },
  { label: "Archived", show: (r) => (r.repo.archived ? "Yes" : "No") },
  {
    label: "Link",
    show: (r) => (
      <a href={r.repo.url} rel="noopener noreferrer" className="text-neon underline underline-offset-4">
        GitHub
      </a>
    ),
  },
];

export function CompareTable({ items }: { items: ScoredRepo[] }) {
  return (
    <div className="glow-card overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            <td className="p-6" />
            {items.map((r) => (
              <th key={r.repo.id} scope="col" className="p-6 align-top font-normal">
                <p className="font-bold">{r.repo.fullName}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const found = row.best?.(items);
            // A tie is not a win: mark a value only when it beats at least one other.
            const best = found && found.size < items.length ? found : undefined;
            return (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="p-6 text-muted">{row.label}</th>
                {items.map((r, i) => (
                  <td key={r.repo.id} className={`p-6 ${best?.has(i) ? "best" : ""}`}>
                    {row.show(r)}
                    {best?.has(i) && <span className="ml-2 text-xs font-bold text-field">best</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
