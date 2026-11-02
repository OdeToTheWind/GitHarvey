import { decodePrefs, encodePrefs } from "./prefs";
import type { Preferences } from "@/types";

// Browser storage for NON-SECRET preferences only. The GitHub token never
// goes here: it lives in the encrypted httpOnly cookie (see session.ts).
const PREFS_KEY = "ghv_prefs";
const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function area(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getPrefsRaw(): string | null {
  try {
    return area()?.getItem(PREFS_KEY) ?? null;
  } catch {
    return null;
  }
}

export function getPrefs(): Preferences | null {
  const raw = getPrefsRaw();
  if (!raw) return null;
  const decoded = decodePrefs(new URLSearchParams(raw));
  return decoded.ok ? decoded.prefs : null;
}

export function setPrefs(prefs: Preferences): void {
  try {
    area()?.setItem(PREFS_KEY, encodePrefs(prefs).toString());
  } catch {
    // Blocked storage: the app still works, preferences just are not remembered.
  }
  listeners.forEach((fn) => fn());
}

export function clearPrefs(): void {
  try {
    area()?.removeItem(PREFS_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn());
}
