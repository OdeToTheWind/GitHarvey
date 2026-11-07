import type { Preferences } from "@/types";

/** A plain sentence about the visitor's answers, for "Your page". Default mode says so instead of guessing a profile. */
export function describePrefs(prefs: Preferences): string {
  const goal = prefs.goal.replace("-", " ");
  const who =
    prefs.audience === "default"
      ? prefs.goal === "default"
        ? "You are searching in default mode"
        : `You want to ${goal}`
      : prefs.goal === "default"
        ? `You are a ${prefs.audience}`
        : `You are a ${prefs.audience} who wants to ${goal}`;
  const language = prefs.language ? ` in ${prefs.language}` : "";
  const priorities = prefs.priorities.includes("any")
    ? " Searching all kinds of repos, with no filters."
    : prefs.priorities.length > 0
      ? ` You care about: ${prefs.priorities.join(", ")}.`
      : "";
  return `${who} with “${prefs.topic}”${language}.${priorities}`;
}
