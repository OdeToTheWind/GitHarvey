import type { Preferences, RepoSummary, ScoringPrefs } from "@/types";
import { encodePrefs, LANGUAGES } from "./prefs";
import { LANGUAGE_NAMES } from "./query";

const MAX_TOPIC = 80;

/** Words that describe what a repo is for: its first two topics, else its name. */
export function topicFromRepo(repo: RepoSummary): string {
  const fromTopics = repo.topics.slice(0, 2).map((t) => t.replace(/-/g, " ")).join(" ");
  const name = repo.fullName.split("/")[1] ?? repo.fullName;
  return (fromTopics || name.replace(/[-_.]/g, " ")).slice(0, MAX_TOPIC).trim();
}

function languageKey(name: string | null): Preferences["language"] {
  return LANGUAGES.find((key) => LANGUAGE_NAMES[key] === name);
}

/** A finder link for repos like this one. The repo itself is left out of the results. */
export function alternativesHref(repo: RepoSummary, scoring: ScoringPrefs): string {
  const prefs: Preferences = {
    audience: scoring.audience,
    goal: "compare",
    topic: topicFromRepo(repo),
    language: languageKey(repo.language),
    priorities: scoring.priorities,
  };
  const params = encodePrefs(prefs);
  params.set("not", repo.fullName);
  return `/finder?${params.toString()}`;
}
