"use client";

import { toggleSaved } from "@/lib/shortlist";
import { useShortlist } from "@/lib/use-stored";

/** Saves a repo name in this browser only. */
export function SaveButton({ fullName }: { fullName: string }) {
  const saved = useShortlist().includes(fullName);
  return (
    <button type="button" aria-pressed={saved} onClick={() => toggleSaved(fullName)} className="btn-secondary">
      {saved ? "Saved" : "Save"}
    </button>
  );
}
