import "server-only";
import type { RateInfo, RepoSummary } from "@/types";
import { cached } from "./cache";
import {
  GitHubAuthError,
  GitHubError,
  GitHubNetworkError,
  GitHubNotFoundError,
  GitHubRateLimitError,
} from "./github-errors";
import { mapRepo, type RawRelease, type RawRepo, type RawSearch } from "./github-map";
import { isValidRepoName } from "./repoName";

const API_BASE = "https://api.github.com";
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
    res = await fetch(`${API_BASE}${path}`, {
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
