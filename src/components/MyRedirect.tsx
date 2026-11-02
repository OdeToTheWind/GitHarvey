"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { encodePrefs } from "@/lib/prefs";
import { getPrefs } from "@/lib/storage";

/** Preferences live in this browser, so the client sends the visitor to the server-rendered page. */
export function MyRedirect() {
  const router = useRouter();
  useEffect(() => {
    const prefs = getPrefs();
    router.replace(prefs ? `/my?${encodePrefs(prefs).toString()}` : "/start");
  }, [router]);
  return <p className="text-muted">Loading your page…</p>;
}
