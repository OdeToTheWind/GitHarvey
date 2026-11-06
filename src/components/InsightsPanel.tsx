import { factsFor, NOT_LOADED } from "@/lib/facts";
import { TREND_LABELS, trendOf } from "@/lib/insights";
import type { RepoExtras, ScoredRepo } from "@/types";
import { Sparkline } from "./Sparkline";

/** "Also worth knowing": facts that help you judge a repo but never change its score. */
export function InsightsPanel({ item, extras }: { item: ScoredRepo; extras: RepoExtras | null }) {
  const facts = factsFor(item.repo, item.health, extras);
  const trend = trendOf(extras?.weeklyCommits ?? null);
  return (
    <section aria-label={`More about ${item.repo.fullName}`} className="mt-4 text-sm">
      <h3 className="font-bold">Also worth knowing</h3>
      <p className="mt-1 text-muted">Information only. None of this changes the score.</p>
      <dl className="mt-3 space-y-3">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-muted">{fact.label}</dt>
            <dd>
              {fact.value}
              {fact.note && fact.value !== NOT_LOADED && <span className="block text-xs text-muted">{fact.note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {extras?.weeklyCommits && trend && (
        <div className="mt-3">
          <Sparkline weeks={extras.weeklyCommits} label={`Commits per week over the last year. ${TREND_LABELS[trend]}.`} />
        </div>
      )}
    </section>
  );
}
