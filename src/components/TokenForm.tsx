"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RemoveTokenButton } from "./RemoveTokenButton";
import { TokenHelp } from "./TokenHelp";

export function TokenForm({ hasToken, next }: { hasToken: boolean; next: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: value.trim(), remember }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) setError(body.error ?? "Something went wrong.");
      else {
        setValue("");
        if (next) router.push(next);
        else router.refresh();
      }
    } catch {
      setError("Could not reach the server. Try again.");
    }
    setBusy(false);
  }

  if (hasToken) {
    return (
      <div className="glow-card flex flex-wrap items-center justify-between gap-3 p-5">
        <p><span className="text-neon">●</span> Token saved in your encrypted cookie.</p>
        <RemoveTokenButton />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={save} className="glow-card space-y-4 p-5">
        <div>
          <label htmlFor="token" className="font-bold">GitHub token (fine-grained, public repositories read-only)</label>
          <input id="token" type="password" autoComplete="off" spellCheck={false} value={value} onChange={(e) => setValue(e.target.value)} className="field-input mt-2" />
        </div>
        <label className="tap flex gap-2 text-muted">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember me for 7 days (otherwise 12 hours)
        </label>
        {error && <p role="alert" className="text-clay">{error}</p>}
        <button type="submit" disabled={busy || value.trim().length < 20} className="btn-primary">
          {busy ? "Checking…" : "Save token"}
        </button>
      </form>
      <TokenHelp />
    </>
  );
}
