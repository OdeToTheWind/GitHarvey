import { Cat } from "../Cat";

// Illustrative numbers only: the same rows a real "Why this score" panel shows.
const ROWS = [
  { label: "Recent activity", detail: "Updated 12 days ago", points: "+40 / 40" },
  { label: "License", detail: "MIT", points: "+15 / 15" },
  { label: "Docs", detail: "Has a homepage", points: "+15 / 15" },
  { label: "Popularity", detail: "3,400 stars", points: "+21.2 / 30" },
  { label: "Release bonus", detail: "Release in the last year", points: "+5 / 5" },
];

export function ExampleCard() {
  return (
    <div>
      <p className="text-sm text-muted">What a result looks like (illustrative, not a real repo)</p>
      <article className="glow-card mt-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-bold">example-org/pdf-toolkit</p>
          <p className="rounded-full border border-field bg-field-soft px-3 py-0.5 text-sm font-bold text-field">
            Healthy 96
          </p>
        </div>
        <Cat name="score" size={72} />
        <p className="mt-1 font-bold">Why this score</p>
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="py-1 pr-2 font-normal">{row.label}</th>
                <td className="py-1 pr-2 text-muted">{row.detail}</td>
                <td className="py-1 text-right whitespace-nowrap">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
