import { COMPARE_ROWS, type Extras } from "@/lib/compare-rows";
import type { ScoredRepo } from "@/types";
import { HealthBadge } from "./HealthBadge";

export function CompareTable({ items, extras = [] }: { items: ScoredRepo[]; extras?: Extras }) {
  return (
    <div className="glow-card overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">Side-by-side comparison of {items.map((r) => r.repo.fullName).join(", ")}</caption>
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
          {COMPARE_ROWS.map((row) => {
            const found = row.best?.(items, extras);
            // A tie is not a win: mark a value only when it beats at least one other.
            const best = found && found.size < items.length ? found : undefined;
            return (
              <tr key={row.label} className="border-b border-line last:border-0">
                <th scope="row" className="p-6 text-muted">{row.label}</th>
                {items.map((r, i) => (
                  <td key={r.repo.id} className={`p-6 ${best?.has(i) ? "best" : ""}`}>
                    {row.kind === "badge" ? (
                      <HealthBadge item={r} />
                    ) : row.kind === "link" ? (
                      <a href={r.repo.url} rel="noopener noreferrer" className="text-neon underline underline-offset-4">GitHub</a>
                    ) : (
                      row.text(r, extras[i] ?? null)
                    )}
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
