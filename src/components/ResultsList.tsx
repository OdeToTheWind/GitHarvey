"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MAX_COMPARE, MIN_COMPARE, TOO_MANY_MESSAGE } from "@/lib/compare";
import { compareHref } from "@/lib/links";
import { weightsFor } from "@/lib/profiles";
import { applyView, DEFAULT_VIEW, type ResultsView } from "@/lib/results-view";
import { scoreRepo } from "@/lib/score";
import { importanceFromWeights, weightsFromImportance } from "@/lib/weights";
import type { Preferences, ScoredRepo, Weights } from "@/types";
import { Cat } from "./Cat";
import { ResultCard } from "./ResultCard";
import { ResultsToolbar } from "./ResultsToolbar";
import { WeightSliders } from "./WeightSliders";

// The "compare" goal starts with the top three ticked; the limit for choosing more is MAX_COMPARE.
const PRESELECT = 3;
const PAGE = 10;

function EmptyState({ prefs }: { prefs: Preferences }) {
  const tips = [
    "Use fewer or more general words.",
    prefs.language ? "Remove the language filter." : null,
    prefs.priorities.some((p) => p !== "any") ? "Turn off a priority such as “actively maintained” or “popular”." : null,
  ].filter((t): t is string => t !== null);
  return (
    <div className="mt-8 max-w-xl">
      <Cat name="search" size={88} />
      <p className="font-bold">No repos found for “{prefs.topic}”.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        {tips.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <Link href="/search-repo" className="btn-primary mt-4">Change answers</Link>
    </div>
  );
}

export function ResultsList({ results, prefs }: { results: ScoredRepo[]; prefs: Preferences }) {
  const router = useRouter();
  // Goal "compare" starts with the top three ticked.
  const [selected, setSelected] = useState<string[]>(() =>
    prefs.goal === "compare" ? results.slice(0, PRESELECT).map((r) => r.repo.fullName) : [],
  );
  const [limitHit, setLimitHit] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [view, setView] = useState<ResultsView>(DEFAULT_VIEW);
  const [tuning, setTuning] = useState<Weights | null>(null);

  const defaults = useMemo(() => importanceFromWeights(weightsFor(prefs.audience, prefs.goal)), [prefs.audience, prefs.goal]);
  const custom = useMemo(() => (tuning ? weightsFromImportance(tuning) : null), [tuning]);
  const scoring = useMemo(() => (custom ? { ...prefs, weights: custom } : prefs), [prefs, custom]);
  const shown = useMemo(() => {
    const scored = custom ? results.map((r) => scoreRepo(r.repo, r.health, scoring)) : results;
    return applyView(scored, view);
  }, [results, custom, scoring, view]);

  function toggle(name: string) {
    // An 11th repo is not added: the visitor gets an alert instead of a silently dead checkbox.
    if (!selected.includes(name) && selected.length >= MAX_COMPARE) {
      setLimitHit(true);
      return;
    }
    setLimitHit(false);
    setSelected((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));
  }

  if (results.length === 0) return <EmptyState prefs={prefs} />;
  return (
    <>
      <ResultsToolbar view={view} onChange={(next) => { setView(next); setVisible(PAGE); }} />
      <WeightSliders value={tuning ?? defaults} tuned={tuning !== null} allZero={tuning !== null && custom === null} onChange={setTuning} onReset={() => setTuning(null)} />
      <p className="mt-10 text-sm text-muted" aria-live="polite">
        Showing {Math.min(visible, shown.length)} of {shown.length} repos{shown.length < results.length ? ` (${results.length - shown.length} hidden by filters)` : ""}, ranked by{" "}
        {view.sort === "health" ? "health" : view.sort === "stars" ? "stars" : "latest push"}. Each score shows its working under “Why this score”.
      </p>
      {shown.length === 0 && (
        <p className="mt-6">
          No repos match these filters. <button type="button" className="text-neon underline underline-offset-4" onClick={() => setView(DEFAULT_VIEW)}>Clear filters</button>
        </p>
      )}
      <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {shown.slice(0, visible).map((item) => (
          <ResultCard
            key={item.repo.id}
            item={item}
            scoring={scoring}
            selected={selected.includes(item.repo.fullName)}
            onToggle={() => toggle(item.repo.fullName)}
          />
        ))}
      </div>
      {visible < shown.length && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn-secondary" onClick={() => setVisible((v) => v + PAGE)}>
            Show {Math.min(PAGE, shown.length - visible)} more
          </button>
        </div>
      )}
      <div className="sticky bottom-4 mt-6 flex flex-col items-end gap-3">
        {limitHit && (
          <p role="alert" className="max-w-md rounded-md border border-clay bg-clay-soft px-4 py-3 text-clay">{TOO_MANY_MESSAGE}</p>
        )}
        <button type="button" className="btn-primary" disabled={selected.length < MIN_COMPARE} onClick={() => router.push(compareHref(selected, prefs))}>
          Compare ({selected.length}) · up to {MAX_COMPARE}
        </button>
      </div>
    </>
  );
}
