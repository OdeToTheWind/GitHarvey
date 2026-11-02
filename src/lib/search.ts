import "server-only";
import type { Preferences, RateInfo, RepoHealth, ScoredRepo, ScoringPrefs } from "@/types";
import { getLatestRelease, getRepo, searchRepos } from "./github";
import { buildSearchQuery, searchSort } from "./query";
import { DEFAULT_SCORING, scoreRepo } from "./score";

/** One GitHub call. Results are scored without release data; see loadRelease. */
export async function runSearch(
  prefs: Preferences,
  token: string,
): Promise<{ results: ScoredRepo[]; rate: RateInfo }> {
  const { repos, rate } = await searchRepos(buildSearchQuery(prefs), token, searchSort(prefs));
  const results = repos
    .map((repo) => scoreRepo(repo, { lastReleaseAt: null, checked: false }, prefs))
    .sort((a, b) => b.score - a.score);
  return { results, rate };
}

export async function loadRelease(fullName: string, token: string): Promise<RepoHealth> {
  const { lastReleaseAt } = await getLatestRelease(fullName, token);
  return { lastReleaseAt, checked: true };
}

/** Fetches a repo plus its latest release and scores it. */
export async function loadScoredRepo(
  fullName: string,
  token: string,
  prefs: ScoringPrefs = DEFAULT_SCORING,
): Promise<ScoredRepo> {
  const [{ repo }, health] = await Promise.all([getRepo(fullName, token), loadRelease(fullName, token)]);
  return scoreRepo(repo, health, prefs);
}
