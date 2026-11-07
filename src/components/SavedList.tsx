"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_COMPARE, MIN_COMPARE, TOO_MANY_MESSAGE } from "@/lib/compare";
import { compareHref, repoHref } from "@/lib/links";
import { DEFAULT_SCORING } from "@/lib/score";
import { clearShortlist, toggleSaved } from "@/lib/shortlist";
import { useShortlist, useStoredPrefs } from "@/lib/use-stored";

/** Repos saved in this browser. Names only: details load from GitHub when you open one. */
export function SavedList() {
  const router = useRouter();
  const saved = useShortlist();
  const prefs = useStoredPrefs();
  const [picked, setPicked] = useState<string[]>([]);
  const [limitHit, setLimitHit] = useState(false);
  const scoring = prefs ?? DEFAULT_SCORING;
  const chosen = picked.filter((n) => saved.includes(n));

  if (saved.length === 0) {
    return (
      <p className="mt-8 max-w-xl text-muted">
        Nothing saved yet. Press Save on a result or a details page, and it will appear here. <Link href="/search-repo" className="text-neon underline underline-offset-4">Start a search</Link>
      </p>
    );
  }
  return (
    <>
      <ul className="mt-8 max-w-2xl divide-y divide-line">
        {saved.map((name) => (
          <li key={name} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <label className="tap gap-3">
              <input
                type="checkbox"
                checked={chosen.includes(name)}
                onChange={() => {
                  if (!chosen.includes(name) && chosen.length >= MAX_COMPARE) {
                    setLimitHit(true);
                    return;
                  }
                  setLimitHit(false);
                  setPicked(chosen.includes(name) ? chosen.filter((n) => n !== name) : [...chosen, name]);
                }}
              />
              <span className="sr-only">Compare </span>
              <Link href={repoHref(name, scoring)} className="underline-offset-4 hover:underline">{name}</Link>
            </label>
            <button type="button" className="tap text-muted underline underline-offset-4" onClick={() => toggleSaved(name)}>Remove</button>
          </li>
        ))}
      </ul>
      {limitHit && <p role="alert" className="mt-6 max-w-md rounded-md border border-clay bg-clay-soft px-4 py-3 text-clay">{TOO_MANY_MESSAGE}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" disabled={chosen.length < MIN_COMPARE} onClick={() => router.push(compareHref(chosen, scoring))}>
          Compare ({chosen.length})
        </button>
        <button type="button" className="btn-secondary" onClick={clearShortlist}>Clear all</button>
      </div>
    </>
  );
}
