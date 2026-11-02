import { encodePrefs } from "./prefs";
import type { Preferences } from "@/types";

/** A link to the finder with preferences only. No token is ever passed in. */
export function buildShareUrl(origin: string, prefs: Preferences): string {
  return `${origin}/finder?${encodePrefs(prefs).toString()}`;
}
