import { decodePrefs, encodePrefs } from "./prefs";
import { createLocalStore } from "./local-store";
import type { Preferences } from "@/types";

// Browser storage for NON-SECRET preferences only. The GitHub token never
// goes here: it lives in the encrypted httpOnly cookie (see session.ts).
const store = createLocalStore("ghv_prefs");

export const subscribe = store.subscribe;
export const getPrefsRaw = store.get;

export function getPrefs(): Preferences | null {
  const raw = getPrefsRaw();
  if (!raw) return null;
  const decoded = decodePrefs(new URLSearchParams(raw));
  return decoded.ok ? decoded.prefs : null;
}

export function setPrefs(prefs: Preferences): void {
  store.set(encodePrefs(prefs).toString());
}

export function clearPrefs(): void {
  store.remove();
}
