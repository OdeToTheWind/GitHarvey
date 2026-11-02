"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RemoveTokenButton({ className = "btn-secondary" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className={className}>
      Remove token
    </button>
  );
}
