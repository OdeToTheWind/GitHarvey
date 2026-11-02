"use client";

import { useState } from "react";
import { buildShareUrl } from "@/lib/share";
import type { Preferences } from "@/types";

export function ShareLink({ prefs }: { prefs: Preferences }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const url = buildShareUrl(window.location.origin, prefs);
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={copy} className="btn-secondary">Copy shareable link</button>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {state === "copied" ? "Link copied. " : state === "failed" ? "Could not copy. " : ""}
        Anyone opening your link will use their own token or limited mode.
      </p>
    </div>
  );
}
