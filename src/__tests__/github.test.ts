import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLatestRelease,
  getRepo,
  githubFetch,
  searchRepos,
  validateToken,
} from "@/lib/github";
import { clearCache } from "@/lib/cache";
import { GitHubAuthError, GitHubNetworkError, GitHubNotFoundError, GitHubRateLimitError } from "@/lib/github-errors";

const TOKEN = "github_pat_SECRET_VALUE_1234567890";

function mockFetch(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearCache();
});

describe("githubFetch", () => {
  it("sends the Authorization header only when a token is given", async () => {
    const withToken = mockFetch(200);
    await githubFetch("/x", TOKEN);
    expect(withToken.mock.calls[0]?.[1].headers.Authorization).toBe(`Bearer ${TOKEN}`);

    const withoutToken = mockFetch(200);
    await githubFetch("/x", null);
    expect(withoutToken.mock.calls[0]?.[1].headers.Authorization).toBeUndefined();
  });

  it("parses rate limit headers", async () => {
    mockFetch(200, {}, { "x-ratelimit-remaining": "42", "x-ratelimit-reset": "1800000000" });
    const { rate } = await githubFetch("/x", TOKEN);
    expect(rate.remaining).toBe(42);
    expect(rate.resetAt).toBe(new Date(1800000000 * 1000).toISOString());
  });

  it("throws GitHubRateLimitError on 403 with remaining 0", async () => {
    mockFetch(403, {}, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1800000000" });
    await expect(githubFetch("/x", TOKEN)).rejects.toBeInstanceOf(GitHubRateLimitError);
  });

  it("throws GitHubAuthError on 401 and NotFound on 404", async () => {
    mockFetch(401);
    await expect(githubFetch("/x", TOKEN)).rejects.toBeInstanceOf(GitHubAuthError);
    mockFetch(404);
    await expect(githubFetch("/x", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
  });

  it("throws GitHubNetworkError when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(`boom ${TOKEN}`)));
    await expect(githubFetch("/x", TOKEN)).rejects.toBeInstanceOf(GitHubNetworkError);
  });

  it("never puts the token in a thrown error", async () => {
    for (const status of [401, 403, 404, 429, 500]) {
      mockFetch(status, {}, { "x-ratelimit-remaining": "0" });
      try {
        await githubFetch("/x", TOKEN);
      } catch (error) {
        expect(String(error)).not.toContain(TOKEN);
        expect(JSON.stringify(error)).not.toContain(TOKEN);
      }
    }
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(TOKEN)));
    try {
      await githubFetch("/x", TOKEN);
    } catch (error) {
      expect(String(error)).not.toContain(TOKEN);
    }
  });
});

describe("repo helpers", () => {
  it("returns null release on 404", async () => {
    mockFetch(404);
    const { lastReleaseAt } = await getLatestRelease("a/b", TOKEN);
    expect(lastReleaseAt).toBeNull();
  });

  it("maps search results and url-encodes the query", async () => {
    const fn = mockFetch(200, {
      items: [
        {
          id: 1,
          full_name: "a/b",
          description: null,
          html_url: "https://github.com/a/b",
          stargazers_count: 5,
          forks_count: 1,
          open_issues_count: 2,
          language: "Go",
          license: { spdx_id: "NOASSERTION" },
          pushed_at: "2026-01-01T00:00:00Z",
          created_at: "2020-01-01T00:00:00Z",
          archived: false,
          homepage: "",
        },
      ],
    });
    const { repos } = await searchRepos("c++ parser", TOKEN);
    expect(fn.mock.calls[0]?.[0]).toContain("q=c%2B%2B%20parser");
    expect(repos[0]).toMatchObject({ fullName: "a/b", license: "Other", homepage: null, topics: [] });
  });

  it("asks for a pool of 30 in one call and only sorts when told to", async () => {
    const first = mockFetch(200, { items: [] });
    await searchRepos("pdf", TOKEN);
    expect(String(first.mock.calls[0]?.[0])).toContain("per_page=30");
    expect(String(first.mock.calls[0]?.[0])).not.toContain("sort=");
    const second = mockFetch(200, { items: [] });
    await searchRepos("pdf", TOKEN, "updated");
    expect(String(second.mock.calls[0]?.[0])).toContain("sort=updated&order=desc");
  });

  it("does not call the network for an empty query", async () => {
    const fn = mockFetch(200);
    await searchRepos("   ", TOKEN);
    expect(fn).not.toHaveBeenCalled();
  });

  it("rejects bad repo names before any request", async () => {
    const fn = mockFetch(200);
    await expect(getRepo("../etc/passwd", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
    await expect(getRepo("../x", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
    await expect(getRepo("a/b/c", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("validateToken", () => {
  it("returns scopes from x-oauth-scopes", async () => {
    mockFetch(200, {}, { "x-oauth-scopes": "repo, read:user" });
    const result = await validateToken(TOKEN);
    expect(result).toMatchObject({ valid: true, scopes: ["repo", "read:user"] });
  });

  it("returns no scopes for a fine-grained token", async () => {
    mockFetch(200);
    expect((await validateToken(TOKEN)).scopes).toEqual([]);
  });

  it("returns valid: false on 401", async () => {
    mockFetch(401);
    expect((await validateToken(TOKEN)).valid).toBe(false);
  });
});
