"use client";

import Link from "next/link";
import { useState } from "react";
import { alternativesHref } from "@/lib/alternatives";
import { ago } from "@/lib/format";
import { repoHref } from "@/lib/links";
import { scoreRepo } from "@/lib/score";
import { useRepoDetails } from "@/lib/use-details";
import type { ScoredRepo, ScoringPrefs } from "@/types";
import { HealthBadge } from "./HealthBadge";
import { InsightsPanel } from "./InsightsPanel";
import { RepoTags } from "./RepoTags";
import { SaveButton } from "./SaveButton";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface Props {
  item: ScoredRepo;
  scoring: ScoringPrefs;
  selected: boolean;
  onToggle: () => void;
}

export function ResultCard({ item, scoring, selected, onToggle }: Props) {
  const { details, busy, failed, load } = useRepoDetails(item.repo.fullName);
  const [open, setOpen] = useState(false);

  const shown = details ? scoreRepo(item.repo, details.health, scoring) : item;
  const { repo } = shown;
  const lookAround = repo.archived || shown.badge === "red";

  function expand() {
    setOpen((o) => !o);
    void load();
  }

  return (
    <article className="glow-card p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base">
          <a href={repo.url} rel="noopener noreferrer" className="underline-offset-4 hover:underline">
            {repo.fullName}
          </a>
        </h2>
        <HealthBadge item={shown} />
      </div>
      <RepoTags repo={repo} />
      {lookAround && (
        <p className="mt-2 text-sm">
          <Link href={alternativesHref(repo, scoring)} className="tap text-neon underline underline-offset-4">Find alternatives</Link>
        </p>
      )}
      {repo.description && <p className="mt-3 line-clamp-2 text-muted">{repo.description}</p>}
      <p className="mt-2 text-sm text-muted">
        ★ {repo.stars.toLocaleString("en-US")}
        {repo.language ? ` · ${repo.language}` : ""} · {repo.license ?? "No license"} · pushed {ago(repo.pushedAt)}
      </p>
      {repo.topics.length > 0 && <p className="mt-2 text-xs text-muted">{repo.topics.slice(0, 4).join(" · ")}</p>}
      <ul className="mt-5 list-disc space-y-2 pl-5 text-sm text-muted">
        {shown.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <ScoreBreakdown item={shown} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <label className="tap gap-2">
          <input type="checkbox" checked={selected} onChange={onToggle} />
          Compare
        </label>
        <div className="flex flex-wrap gap-3">
          <SaveButton fullName={repo.fullName} />
          <button type="button" onClick={expand} aria-expanded={open} className="btn-secondary">
            {open ? "Hide details" : "Expand"}
          </button>
        </div>
      </div>
      {open && (
        <div aria-live="polite">
          {busy && <p className="mt-3 text-sm text-muted">Loading…</p>}
          {failed && <p className="mt-3 text-sm text-clay">Could not load the details. Try again.</p>}
          {details && <InsightsPanel item={shown} extras={details.extras} />}
          <p className="mt-4 text-sm">
            <Link href={repoHref(repo.fullName, scoring)} className="tap text-neon underline underline-offset-4">Open details page</Link>
          </p>
        </div>
      )}
    </article>
  );
}
