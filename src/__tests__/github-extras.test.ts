import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCache } from "@/lib/cache";
import {
  getContributorCount,
  getGoodFirstIssueCount,
  getMergeSpeed,
  getRootFile,
  getWeeklyCommits,
  githubFetch,
  orNull,
} from "@/lib/github";
import { GitHubAuthError, GitHubNotFoundError, GitHubRateLimitError } from "@/lib/github-errors";

const TOKEN = "github_pat_SECRET_VALUE_1234567890";

function mockFetch(status: number, body: unknown = {}, headers: Record<string, string> = {}) {
  const fn = vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status, headers }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearCache();
});

describe("extra repo facts", () => {
  it("works out the median merge time from closed pull requests", async () => {
    const day = 86_400_000;
    const at = (d: number) => new Date(Date.parse("2026-01-01T00:00:00Z") + d * day).toISOString();
    mockFetch(200, [
      { created_at: at(0), merged_at: at(1) },
      { created_at: at(0), merged_at: at(2) },
      { created_at: at(0), merged_at: at(9) },
      { created_at: at(0), merged_at: null },
    ]);
    expect(await getMergeSpeed("a/b", TOKEN)).toEqual({ medianDays: 2, sampled: 3 });
  });

  it("counts contributors from the last page number", async () => {
    mockFetch(200, [{}], { link: '<https://api.github.com/repositories/1/contributors?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/contributors?per_page=1&page=87>; rel="last"' });
    expect(await getContributorCount("a/b", TOKEN)).toBe(87);
    clearCache();
    mockFetch(200, [{}]);
    expect(await getContributorCount("a/b", TOKEN)).toBe(1);
  });

  it("reads weekly commit totals, and treats 'still computing' as unavailable", async () => {
    mockFetch(200, [{ total: 3 }, { total: 0 }]);
    expect(await getWeeklyCommits("a/b", TOKEN)).toEqual([3, 0]);
    clearCache();
    mockFetch(202, {});
    await expect(getWeeklyCommits("a/b", TOKEN)).rejects.toBeTruthy();
  });

  it("counts open good-first-issues with a search for that label", async () => {
    const fn = mockFetch(200, { total_count: 12 });
    expect(await getGoodFirstIssueCount("a/b", TOKEN)).toBe(12);
    expect(decodeURIComponent(String(fn.mock.calls[0]?.[0]))).toContain('repo:a/b label:"good first issue" state:open');
  });

  it("decodes a root file and treats a missing one as null", async () => {
    mockFetch(200, { encoding: "base64", content: Buffer.from('{"dependencies":{"x":"1"}}').toString("base64") });
    expect(await getRootFile("a/b", "package.json", TOKEN)).toContain('"dependencies"');
    clearCache();
    mockFetch(404);
    expect(await getRootFile("a/b", "package.json", TOKEN)).toBeNull();
  });

  it("rejects bad repo names before any request", async () => {
    const fn = mockFetch(200);
    await expect(getMergeSpeed("../x", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
    await expect(getRootFile("a/b/c", "package.json", TOKEN)).rejects.toBeInstanceOf(GitHubNotFoundError);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("orNull", () => {
  it("turns a missing answer into null but lets a bad token or a rate limit through", async () => {
    expect(await orNull(async () => { throw new GitHubNotFoundError(); })).toBeNull();
    expect(await orNull(async () => 5)).toBe(5);
    await expect(orNull(async () => { throw new GitHubAuthError(); })).rejects.toBeInstanceOf(GitHubAuthError);
    await expect(orNull(async () => { throw new GitHubRateLimitError(null); })).rejects.toBeInstanceOf(GitHubRateLimitError);
    expect(await orNull(async () => { throw new GitHubRateLimitError(null); }, true)).toBeNull();
  });
});

describe("test-only GitHub address", () => {
  it("is ignored in production, and for anything that is not this machine", async () => {
    vi.stubEnv("GITHARVEY_GITHUB_API", "http://localhost:4010");
    vi.stubEnv("NODE_ENV", "production");
    const prod = mockFetch(200);
    await githubFetch("/x", TOKEN);
    expect(String(prod.mock.calls[0]?.[0])).toBe("https://api.github.com/x");

    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("GITHARVEY_GITHUB_API", "https://evil.example");
    const evil = mockFetch(200);
    await githubFetch("/x", TOKEN);
    expect(String(evil.mock.calls[0]?.[0])).toBe("https://api.github.com/x");
  });
  it("lets a local fake stand in for GitHub outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GITHARVEY_GITHUB_API", "http://localhost:4010");
    const fn = mockFetch(200);
    await githubFetch("/x", TOKEN);
    expect(String(fn.mock.calls[0]?.[0])).toBe("http://localhost:4010/x");
  });
});
