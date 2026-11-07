import "server-only";
import type { Preferences, RateInfo, RepoDetails, RepoExtras, RepoHealth, RepoSummary, ScoredRepo, ScoringPrefs } from "@/types";
import {
  getContributorCount,
  getGoodFirstIssueCount,
  getLatestRelease,
  getMergeSpeed,
  getRepo,
  getRootFile,
  getWeeklyCommits,
  orNull,
  searchRepos,
} from "./github";
import { countPackageJson, countRequirements } from "./insights";
import { buildSearchQuery, searchSort } from "./query";
import { DEFAULT_SCORING, scoreRepo } from "./score";

/** One GitHub call. Results are scored without release data; see loadDetails. */
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

async function loadRelease(fullName: string, token: string): Promise<RepoHealth> {
  const { lastReleaseAt } = await getLatestRelease(fullName, token);
  return { lastReleaseAt, checked: true };
}

/** Top-level dependency count for the two manifests we can read cheaply. Approximate by design. */
async function loadDependencies(repo: RepoSummary, token: string): Promise<RepoExtras["dependencies"]> {
  const file = repo.language === "Python" ? "requirements.txt" : repo.language === "JavaScript" || repo.language === "TypeScript" ? "package.json" : null;
  if (!file) return null;
  const text = await getRootFile(repo.fullName, file, token);
  if (text === null) return null;
  const count = file === "package.json" ? countPackageJson(text) : countRequirements(text);
  return count === null ? null : { count, file };
}

/**
 * Release info plus the extra facts. Each extra is optional: if GitHub cannot answer one, it shows as
 * "not available" and the rest still load. A rejected token or a rate limit still stops everything.
 */
export async function loadDetails(fullName: string, token: string): Promise<RepoDetails> {
  const { repo } = await getRepo(fullName, token);
  const [health, mergeSpeed, contributors, weeklyCommits, goodFirstIssues, dependencies] = await Promise.all([
    loadRelease(fullName, token),
    orNull(() => getMergeSpeed(fullName, token)),
    orNull(() => getContributorCount(fullName, token)),
    orNull(() => getWeeklyCommits(fullName, token)),
    orNull(() => getGoodFirstIssueCount(fullName, token), true),
    orNull(() => loadDependencies(repo, token)),
  ]);
  return { health, extras: { mergeSpeed, contributors, weeklyCommits, goodFirstIssues, dependencies } };
}

const NO_EXTRAS: RepoExtras = { mergeSpeed: null, contributors: null, weeklyCommits: null, goodFirstIssues: null, dependencies: null };

/**
 * A repo, its details and its score, for the compare and detail pages. `lite` skips the slower extra facts
 * (about seven GitHub calls per repo) so a big comparison stays within GitHub's limits.
 */
export async function loadScoredRepo(
  fullName: string,
  token: string,
  prefs: ScoringPrefs = DEFAULT_SCORING,
  lite = false,
): Promise<{ scored: ScoredRepo; extras: RepoExtras }> {
  if (lite) {
    const [{ repo }, health] = await Promise.all([getRepo(fullName, token), loadRelease(fullName, token)]);
    return { scored: scoreRepo(repo, health, prefs), extras: NO_EXTRAS };
  }
  const [{ repo }, { health, extras }] = await Promise.all([getRepo(fullName, token), loadDetails(fullName, token)]);
  return { scored: scoreRepo(repo, health, prefs), extras };
}
