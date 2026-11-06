"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ends the session: deletes the encrypted cookie. (Revoking the approval itself is done in GitHub's settings.) */
export function SignOutButton({ className = "btn-secondary" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      Sign out
    </button>
  );
}
