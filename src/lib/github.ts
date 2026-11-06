import "server-only";
import type { RateInfo, RepoSummary } from "@/types";
import { medianMergeDays } from "./insights";
import { cached } from "./cache";
import {
  GitHubAuthError,
  GitHubError,
  GitHubNetworkError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "./github-errors";
import {
  mapRepo,
  type RawContent,
  type RawCount,
  type RawPull,
  type RawRelease,
  type RawRepo,
  type RawSearch,
  type RawWeek,
} from "./github-map";
import { isValidRepoName } from "./repoName";

const PUBLIC_API = "https://api.github.com";

/**
 * Tests and local demos can point the client at a fake GitHub on this machine. The override is
 * ignored in production and for any address that is not localhost, so a token can never be sent
 * to a stranger's server.
 */
function apiBase(): string {
  const override = process.env.GITHARVEY_GITHUB_API;
  if (!override || process.env.NODE_ENV === "production") return PUBLIC_API;
  try {
    const url = new URL(override);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" ? url.origin : PUBLIC_API;
  } catch {
    return PUBLIC_API;
  }
}
const API_VERSION = "2022-11-28";
// GitHarvey scores this many matches and re-ranks them by health. One call.
const SEARCH_PAGE_SIZE = 30;

// Server-side client: the token goes only to api.github.com.
// Error messages are static on purpose (see github-errors.ts): they must never
// contain the token, the Authorization header, or any request detail.

export interface GitHubResponse<T> {
  data: T;
  rate: RateInfo;
  headers: Headers;
}

const NO_RATE: RateInfo = { remaining: null, resetAt: null };

function parseRate(headers: Headers): RateInfo {
  const remainingRaw = headers.get("x-ratelimit-remaining");
  const resetRaw = headers.get("x-ratelimit-reset");
  const remaining = remainingRaw === null ? NaN : Number(remainingRaw);
  const reset = resetRaw === null ? NaN : Number(resetRaw);
  return {
    remaining: Number.isFinite(remaining) ? remaining : null,
    resetAt: Number.isFinite(reset) ? new Date(reset * 1000).toISOString() : null,
  };
}

export async function githubFetch<T>(
  path: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<GitHubResponse<T>> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      headers,
      cache: "no-store",
      signal,
    });
  } catch {
    throw new GitHubNetworkError();
  }

  const rate = parseRate(res.headers);

  if (res.status === 401) throw new GitHubAuthError();
  if (res.status === 404) throw new GitHubNotFoundError();
  if (res.status === 403 || res.status === 429) {
    const limited =
      res.status === 429 ||
      rate.remaining === 0 ||
      res.headers.has("retry-after");
    if (limited) throw new GitHubRateLimitError(rate.resetAt);
    throw new GitHubError(res.status);
  }
  if (!res.ok) throw new GitHubError(res.status);

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new GitHubError(res.status);
  }
  return { data, rate, headers: res.headers };
}

export async function searchRepos(
  query: string,
  token: string | null,
  sort?: "updated",
): Promise<{ repos: RepoSummary[]; rate: RateInfo }> {
  if (!query.trim()) return { repos: [], rate: NO_RATE };
  const order = sort ? `&sort=${sort}&order=desc` : "";
  const path = `/search/repositories?q=${encodeURIComponent(query)}${order}&per_page=${SEARCH_PAGE_SIZE}`;
  return cached(path, async () => {
    const { data, rate } = await githubFetch<RawSearch>(path, token);
    return { repos: (data.items ?? []).map(mapRepo), rate };
  });
}

export async function getRepo(
  fullName: string,
  token: string | null,
): Promise<{ repo: RepoSummary; rate: RateInfo }> {
  if (!isValidRepoName(fullName)) throw new GitHubNotFoundError();
  const path = `/repos/${fullName}`;
  return cached(path, async () => {
    const { data, rate } = await githubFetch<RawRepo>(path, token);
    return { repo: mapRepo(data), rate };
  });
}

export async function getLatestRelease(
  fullName: string,
  token: string | null,
): Promise<{ lastReleaseAt: string | null; rate: RateInfo }> {
  if (!isValidRepoName(fullName)) throw new GitHubNotFoundError();
  const path = `/repos/${fullName}/releases/latest`;
  return cached(path, async () => {
    try {
      const { data, rate } = await githubFetch<RawRelease>(path, token);
      return { lastReleaseAt: data.published_at ?? data.created_at ?? null, rate };
    } catch (error) {
      if (error instanceof GitHubNotFoundError) {
        return { lastReleaseAt: null, rate: NO_RATE };
      }
      throw error;
    }
  });
}

/**
 * Runs an optional lookup. A missing or odd answer becomes null; a bad token still surfaces, and so does
 * a rate limit unless the lookup has a quota of its own (`ownQuota`), which must not sink the others.
 */
export async function orNull<T>(run: () => Promise<T>, ownQuota = false): Promise<T | null> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof GitHubAuthError) throw error;
    if (error instanceof GitHubRateLimitError && !ownQuota) throw error;
    return null;
  }
}

function checkedName(fullName: string): string {
  if (!isValidRepoName(fullName)) throw new GitHubNotFoundError();
  return fullName;
}

/** Median time to merge, from the 30 most recently updated closed pull requests. */
export async function getMergeSpeed(fullName: string, token: string | null) {
  const path = `/repos/${checkedName(fullName)}/pulls?state=closed&sort=updated&direction=desc&per_page=30`;
  return cached(path, async () => {
    const { data } = await githubFetch<RawPull[]>(path, token);
    return medianMergeDays(data.map((p) => ({ createdAt: p.created_at, mergedAt: p.merged_at })));
  });
}

/** Contributor count: one item per page, so the page number of the last page is the count. */
export async function getContributorCount(fullName: string, token: string | null): Promise<number> {
  const path = `/repos/${checkedName(fullName)}/contributors?per_page=1`;
  return cached(path, async () => {
    const { data, headers } = await githubFetch<unknown[]>(path, token);
    const last = /[?&]page=(\d+)>; rel="last"/.exec(headers.get("link") ?? "");
    return last ? Number(last[1]) : data.length;
  });
}

/** Commits per week for the last year. GitHub may answer "still computing" at first; that reads as unavailable. */
export async function getWeeklyCommits(fullName: string, token: string | null): Promise<number[]> {
  const path = `/repos/${checkedName(fullName)}/stats/commit_activity`;
  return cached(path, async () => {
    const { data } = await githubFetch<RawWeek[]>(path, token);
    if (!Array.isArray(data)) throw new GitHubError(202);
    return data.map((w) => w.total);
  });
}

/** Open issues labelled "good first issue". Uses the search API, which has its own, smaller quota. */
export async function getGoodFirstIssueCount(fullName: string, token: string | null): Promise<number> {
  const query = `repo:${checkedName(fullName)} label:"good first issue" state:open is:issue`;
  const path = `/search/issues?q=${encodeURIComponent(query)}&per_page=1`;
  return cached(path, async () => (await githubFetch<RawCount>(path, token)).data.total_count);
}

/** The text of a file in the repo's root, or null when it is missing or too large to be inlined. */
export async function getRootFile(fullName: string, file: string, token: string | null): Promise<string | null> {
  const path = `/repos/${checkedName(fullName)}/contents/${file}`;
  return cached(path, async () => {
    try {
      const { data } = await githubFetch<RawContent>(path, token);
      if (data.encoding !== "base64" || !data.content) return null;
      return Buffer.from(data.content, "base64").toString("utf8");
    } catch (error) {
      if (error instanceof GitHubNotFoundError) return null;
      throw error;
    }
  });
}

export interface TokenCheck {
  valid: boolean;
  scopes: string[];
  rate: RateInfo;
}

/**
 * Validates a token with GET /rate_limit (does not spend quota).
 * Classic tokens report their scopes in `x-oauth-scopes`; fine-grained tokens
 * do not. Callers reject tokens that report any scope.
 */
export async function validateToken(token: string): Promise<TokenCheck> {
  try {
    const { rate, headers } = await githubFetch<unknown>("/rate_limit", token);
    const scopes = (headers.get("x-oauth-scopes") ?? "")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);
    return { valid: true, scopes, rate };
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return { valid: false, scopes: [], rate: NO_RATE };
    }
    throw error;
  }
}
