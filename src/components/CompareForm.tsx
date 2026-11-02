"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { compareHref } from "@/lib/links";
import type { ScoringPrefs } from "@/types";

export function CompareForm({ initial, scoring }: { initial: string; scoring: ScoringPrefs }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  return (
    <form
      className="mt-6 flex max-w-xl flex-wrap gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(compareHref(text.split(",").map((n) => n.trim()).filter(Boolean), scoring));
      }}
    >
      <label htmlFor="repos" className="sr-only">Repos to compare, as owner/repo separated by commas</label>
      <input id="repos" value={text} onChange={(e) => setText(e.target.value)} placeholder="owner/repo, owner/repo" className="field-input min-w-0 flex-1" />
      <button type="submit" className="btn-primary">Compare</button>
    </form>
  );
}
