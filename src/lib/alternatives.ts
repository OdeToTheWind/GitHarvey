import type { Preferences, RepoSummary, ScoringPrefs } from "@/types";
import { encodePrefs, isValidLanguage, LANGUAGES } from "./prefs";
import { LANGUAGE_NAMES } from "./query";

const MAX_TOPIC = 80;

/** Words that describe what a repo is for: its first two topics, else its name. */
export function topicFromRepo(repo: RepoSummary): string {
  const fromTopics = repo.topics.slice(0, 2).map((t) => t.replace(/-/g, " ")).join(" ");
  const name = repo.fullName.split("/")[1] ?? repo.fullName;
  return (fromTopics || name.replace(/[-_.]/g, " ")).slice(0, MAX_TOPIC).trim();
}

/** The listed key when the repo's language is one of ours, else the language name itself (if it is safe to search by). */
function languageFor(name: string | null): Preferences["language"] {
  if (!name) return undefined;
  return LANGUAGES.find((key) => LANGUAGE_NAMES[key] === name) ?? (isValidLanguage(name) ? name : undefined);
}

/** A finder link for repos like this one. The repo itself is left out of the results. */
export function alternativesHref(repo: RepoSummary, scoring: ScoringPrefs): string {
  const prefs: Preferences = {
    audience: scoring.audience,
    goal: "compare",
    topic: topicFromRepo(repo),
    language: languageFor(repo.language),
    priorities: scoring.priorities,
  };
  const params = encodePrefs(prefs);
  params.set("not", repo.fullName);
  return `/finder?${params.toString()}`;
}
