import Link from "next/link";
import { alternativesHref } from "@/lib/alternatives";
import { ago } from "@/lib/format";
import type { RepoExtras, ScoredRepo, ScoringPrefs } from "@/types";
import { CompareForm } from "./CompareForm";
import { CopyLinkButton } from "./CopyLinkButton";
import { HealthBadge } from "./HealthBadge";
import { InsightsPanel } from "./InsightsPanel";
import { RepoTags } from "./RepoTags";
import { SaveButton } from "./SaveButton";
import { ScoreBreakdown } from "./ScoreBreakdown";

/** Everything the detail page shows about one repo. Data is loaded by the page; this only lays it out. */
export function RepoDetails({ scored, extras, scoring }: { scored: ScoredRepo; extras: RepoExtras; scoring: ScoringPrefs }) {
  const { repo } = scored;
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <HealthBadge item={scored} />
        <a href={repo.url} rel="noopener noreferrer" className="text-neon underline underline-offset-4">View on GitHub</a>
      </div>
      <RepoTags repo={repo} />
      {repo.description && <p className="mt-4 max-w-3xl text-muted">{repo.description}</p>}
      <p className="mt-3 text-sm text-muted">
        ★ {repo.stars.toLocaleString("en-US")}
        {repo.language ? ` · ${repo.language}` : ""} · {repo.license ?? "No license"} · pushed {ago(repo.pushedAt)}
      </p>
      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-24">
        <section aria-labelledby="why-h">
          <h2 id="why-h" className="text-2xl">Why this score</h2>
          <ScoreBreakdown item={scored} open />
        </section>
        <section aria-labelledby="facts-h">
          <h2 id="facts-h" className="text-2xl">More facts</h2>
          <InsightsPanel item={scored} extras={extras} />
        </section>
      </div>
      <div className="mt-12 flex flex-wrap items-start gap-4">
        <SaveButton fullName={repo.fullName} />
        <Link href={alternativesHref(repo, scoring)} className="btn-secondary">Find alternatives</Link>
      </div>
      <h2 className="mt-12 text-2xl">Compare with another repo</h2>
      <CompareForm initial={`${repo.fullName}, `} scoring={scoring} />
      <div className="mt-8"><CopyLinkButton label="Copy link to this page" /></div>
    </>
  );
}
