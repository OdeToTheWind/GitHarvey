"use client";

import { useRouter } from "next/navigation";
import { clearPrefs } from "@/lib/storage";

/** Clears the saved preferences and signs out. */
export function MyActions() {
  const router = useRouter();
  async function clearAll() {
    clearPrefs();
    await fetch("/api/session", { method: "DELETE" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  }
  return (
    <button type="button" className="btn-secondary" onClick={clearAll}>
      Sign out and clear my data
    </button>
  );
}
