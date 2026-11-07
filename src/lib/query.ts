import type { Preferences } from "@/types";

export const LANGUAGE_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** "Stay updated" looks at recently updated repos first. Everything else uses GitHub's best match. */
export function searchSort(prefs: Preferences): "updated" | undefined {
  return prefs.goal === "stay-updated" ? "updated" : undefined;
}

/** `language:Go`, or `language:"Jupyter Notebook"` when the name has spaces. Quotes and colons are stripped. */
function languageQualifier(language: string): string {
  const name = (LANGUAGE_NAMES[language] ?? language).replace(/["':]/g, "").trim();
  return /\s/.test(name) ? `language:"${name}"` : `language:${name}`;
}

/** Builds a GitHub search query. Empty topic gives an empty string (no request is made). */
export function buildSearchQuery(prefs: Preferences, now: Date = new Date()): string {
  // Strip ":" and quotes so users cannot inject search qualifiers. Keeps c++ and node.js.
  const topic = prefs.topic.replace(/[:"]/g, " ").replace(/\s+/g, " ").trim();
  if (!topic) return "";
  const parts = [topic, "archived:false"];
  // Skip the tiniest repos unless "popular" already asks for more.
  parts.push(prefs.priorities.includes("popular") ? "stars:>100" : "stars:>10");
  if (prefs.priorities.includes("beginner-friendly")) parts.push("good-first-issues:>0");
  if (prefs.language) parts.push(languageQualifier(prefs.language));
  if (prefs.priorities.includes("maintained")) {
    parts.push(`pushed:>${isoDate(now.getTime() - 365 * DAY_MS)}`);
  }
  return parts.join(" ");
}
