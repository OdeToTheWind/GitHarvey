"use client";

import { useState } from "react";

/** Copies this page's address. Used for compare pages, whose address holds only repo names and scoring settings. */
export function CopyLinkButton({ label }: { label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <button type="button" onClick={copy} className="btn-secondary">{label}</button>
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {state === "copied" ? "Link copied." : state === "failed" ? "Could not copy. Copy the address from your browser." : ""}
      </p>
    </div>
  );
}
