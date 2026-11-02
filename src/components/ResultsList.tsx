"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { compareHref } from "@/lib/links";
import type { Preferences, ScoredRepo } from "@/types";
import { Cat } from "./Cat";
import { ResultCard } from "./ResultCard";

const MAX_COMPARE = 3;
const PAGE = 10;

function EmptyState({ prefs }: { prefs: Preferences }) {
  const tips = [
    "Use fewer or more general words.",
    prefs.language ? "Remove the language filter." : null,
    prefs.priorities.length > 0 ? "Turn off a priority such as “actively maintained” or “popular”." : null,
  ].filter((t): t is string => t !== null);
  return (
    <div className="mt-8 max-w-xl">
      <Cat name="search" size={88} />
      <p className="font-bold">No repos found for “{prefs.topic}”.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        {tips.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <Link href="/start" className="btn-primary mt-4">Change answers</Link>
    </div>
  );
}

export function ResultsList({ results, prefs }: { results: ScoredRepo[]; prefs: Preferences }) {
  const router = useRouter();
  // Goal "compare" starts with the top three ticked.
  const [selected, setSelected] = useState<string[]>(() =>
    prefs.goal === "compare" ? results.slice(0, MAX_COMPARE).map((r) => r.repo.fullName) : [],
  );
  const [visible, setVisible] = useState(PAGE);

  function toggle(name: string) {
    setSelected((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));
  }

  if (results.length === 0) return <EmptyState prefs={prefs} />;
  return (
    <>
      <p className="mt-10 text-sm text-muted">
        Showing {Math.min(visible, results.length)} of {results.length} repos, ranked by health. Each score shows its working under “Why this score”.
      </p>
      <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {results.slice(0, visible).map((item) => (
          <ResultCard
            key={item.repo.id}
            item={item}
            scoring={prefs}
            selected={selected.includes(item.repo.fullName)}
            canSelect={selected.length < MAX_COMPARE}
            onToggle={() => toggle(item.repo.fullName)}
          />
        ))}
      </div>
      {visible < results.length && (
        <div className="mt-12 flex justify-center">
          <button type="button" className="btn-secondary" onClick={() => setVisible((v) => v + PAGE)}>
            Show {Math.min(PAGE, results.length - visible)} more
          </button>
        </div>
      )}
      <div className="sticky bottom-4 mt-6 flex justify-end">
        <button type="button" className="btn-primary" disabled={selected.length < 2} onClick={() => router.push(compareHref(selected, prefs))}>
          Compare ({selected.length})
        </button>
      </div>
    </>
  );
}
