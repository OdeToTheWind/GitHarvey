import type { ScoredRepo } from "@/types";

/** "Why this score": every signal with the points it added. */
export function ScoreBreakdown({ item }: { item: ScoredRepo }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="tap cursor-pointer font-bold">Why this score</summary>
      <table className="mt-2 w-full border-collapse text-left">
        <caption className="sr-only">How the score of {item.repo.fullName} adds up</caption>
        <thead className="sr-only">
          <tr><th scope="col">Signal</th><th scope="col">Detail</th><th scope="col">Points</th></tr>
        </thead>
        <tbody>
          {item.breakdown.map((line) => (
            <tr key={line.label} className="border-t border-line">
              <th scope="row" className="py-1 pr-2 font-normal">{line.label}</th>
              <td className="py-1 pr-2 text-muted">{line.detail}</td>
              <td className="py-1 text-right whitespace-nowrap">+{line.points} / {line.max}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-muted">
        Score {item.score} out of 100.
        {item.repo.archived ? " Archived repos are capped at 20." : ""}
        {!item.repo.archived && item.breakdown.reduce((n, l) => n + l.points, 0) > 100.5 ? " Points above 100 are not counted." : ""}{" "}
        Scores are a starting point, not a verdict.
      </p>
    </details>
  );
}
