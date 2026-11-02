"use client";

import { useState } from "react";
import { getJson } from "@/lib/client-api";
import { ago } from "@/lib/format";
import { scoreRepo } from "@/lib/score";
import type { RepoHealth, ScoredRepo, ScoringPrefs } from "@/types";
import { HealthBadge } from "./HealthBadge";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface Props {
  item: ScoredRepo;
  scoring: ScoringPrefs;
  selected: boolean;
  canSelect: boolean;
  onToggle: () => void;
}

export function ResultCard({ item, scoring, selected, canSelect, onToggle }: Props) {
  const [health, setHealth] = useState<RepoHealth | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const shown = health ? scoreRepo(item.repo, health, scoring) : item;
  const { repo } = shown;

  async function expand() {
    setOpen((o) => !o);
    if (health || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      setHealth(await getJson<RepoHealth>(`/api/release?name=${encodeURIComponent(repo.fullName)}`));
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }

  return (
    <article className="glow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a href={repo.url} rel="noopener noreferrer" className="font-bold underline-offset-4 hover:underline">
          {repo.fullName}
        </a>
        <HealthBadge item={shown} />
      </div>
      {repo.description && <p className="mt-2 line-clamp-2 text-muted">{repo.description}</p>}
      <p className="mt-2 text-sm text-muted">
        ★ {repo.stars.toLocaleString("en-US")}
        {repo.language ? ` · ${repo.language}` : ""} · {repo.license ?? "No license"} · pushed {ago(repo.pushedAt)}
      </p>
      {repo.topics.length > 0 && <p className="mt-2 text-xs text-muted">{repo.topics.slice(0, 4).join(" · ")}</p>}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        {shown.reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <ScoreBreakdown item={shown} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="tap gap-2">
          <input type="checkbox" checked={selected} disabled={!selected && !canSelect} onChange={onToggle} />
          Compare
        </label>
        <button type="button" onClick={expand} aria-expanded={open} className="btn-secondary">
          {open ? "Hide release info" : "Expand"}
        </button>
      </div>
      {open && (
        <p className="mt-3 text-sm text-muted" aria-live="polite">
          {busy ? "Loading…" : failed ? "Could not load release info." : `Last release: ${ago(health?.lastReleaseAt ?? null)}. The score now includes it.`}
        </p>
      )}
    </article>
  );
}
