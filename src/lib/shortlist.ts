import { createLocalStore } from "./local-store";
import { isValidRepoName } from "./repoName";

// Saved repos: names only, kept in this browser. No token, no account, no server copy.
const store = createLocalStore("ghv_shortlist");
const MAX_SAVED = 30;

export const subscribeShortlist = store.subscribe;
export const getShortlistRaw = store.get;

export function parseShortlist(raw: string | null): string[] {
  const names = (raw ?? "").split(",").filter(isValidRepoName);
  return Array.from(new Set(names)).slice(0, MAX_SAVED);
}

/** Adds the repo, or removes it when it is already saved. A full list ignores new additions. */
export function toggleSaved(name: string): void {
  if (!isValidRepoName(name)) return;
  const current = parseShortlist(store.get());
  const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name].slice(0, MAX_SAVED);
  if (next.length === 0) store.remove();
  else store.set(next.join(","));
}

export function clearShortlist(): void {
  store.remove();
}
