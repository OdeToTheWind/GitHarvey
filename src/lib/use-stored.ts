"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Preferences } from "@/types";
import { decodePrefs } from "./prefs";
import { getShortlistRaw, parseShortlist, subscribeShortlist } from "./shortlist";
import { getPrefsRaw, subscribe } from "./storage";

/** Saved preferences (or null). Server and first client render see null. */
export function useStoredPrefs(): Preferences | null {
  const raw = useSyncExternalStore(subscribe, getPrefsRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    const decoded = decodePrefs(new URLSearchParams(raw));
    return decoded.ok ? decoded.prefs : null;
  }, [raw]);
}

/** Saved repo names (empty on the server and on the first client render). */
export function useShortlist(): string[] {
  const raw = useSyncExternalStore(subscribeShortlist, getShortlistRaw, () => null);
  return useMemo(() => parseShortlist(raw), [raw]);
}
