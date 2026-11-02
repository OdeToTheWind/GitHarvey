import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderBadge } from "@/lib/badge";
import { safeNext } from "@/lib/redirect";

describe("safeNext", () => {
  it("allows our own result pages with their query", () => {
    expect(safeNext("/finder?aud=developer&q=pdf")).toBe("/finder?aud=developer&q=pdf");
    expect(safeNext("/compare?repos=a%2Fb%2Cc%2Fd")).toBe("/compare?repos=a%2Fb%2Cc%2Fd");
    expect(safeNext("/my?aud=founder")).toBe("/my?aud=founder");
  });
  it("rejects anything that could leave the site or reach another page", () => {
    for (const bad of ["//evil.test", "https://evil.test/finder", "/\\evil.test", "/start", "/api/session", "javascript:alert(1)", "/finder/../start", "", null, undefined, "/finder\n"]) {
      expect(safeNext(bad as string | null | undefined), String(bad)).toBeNull();
    }
    expect(safeNext(`/finder?q=${"a".repeat(600)}`)).toBeNull();
  });
});

describe("renderBadge", () => {
  it("escapes text so a repo name can never inject markup", () => {
    const svg = renderBadge("GitHarvey", '<script>alert("x")</script>', "gray");
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
  it("shows label, value and a colour", () => {
    const svg = renderBadge("GitHarvey", "Healthy 82", "green");
    expect(svg).toContain("Healthy 82");
    expect(svg).toContain("#1b6b3a");
    expect(svg.startsWith("<svg")).toBe(true);
  });
});

const loadScoredRepo = vi.fn();
vi.mock("@/lib/search", () => ({ loadScoredRepo: (...a: unknown[]) => loadScoredRepo(...a) }));

describe("GET /api/badge/[owner]/[repo]", () => {
  let ip = 0;
  const call = async (owner: string, repo: string) => {
    const { GET } = await import("@/app/api/badge/[owner]/[repo]/route");
    ip += 1;
    return GET(new Request(`https://githarvey.test/api/badge/${owner}/${repo}`, { headers: { "x-forwarded-for": `10.2.0.${ip}` } }), {
      params: Promise.resolve({ owner, repo }),
    });
  };
  beforeEach(() => loadScoredRepo.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("says unavailable, without calling GitHub, when the host has no fallback token", async () => {
    const res = await call("a", "b");
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    expect(await res.text()).toContain("unavailable");
    expect(loadScoredRepo).not.toHaveBeenCalled();
  });
  it("rejects bad names", async () => {
    expect((await call("..", "x")).status).toBe(400);
  });
  it("uses only the fallback token and returns a public, cacheable badge", async () => {
    vi.stubEnv("ENABLE_FALLBACK", "true");
    vi.stubEnv("FALLBACK_GITHUB_TOKEN", "github_pat_FALLBACK_SECRET_123456");
    loadScoredRepo.mockResolvedValue({ score: 82, badge: "green", repo: { archived: false } });
    const res = await call("a", "b");
    const body = await res.text();
    expect(body).toContain("Healthy 82");
    expect(body).not.toContain("FALLBACK_SECRET");
    expect(res.headers.get("cache-control")).toContain("public");
    expect(loadScoredRepo).toHaveBeenCalledWith("a/b", "github_pat_FALLBACK_SECRET_123456");
  });
  it("shows not found for missing repos", async () => {
    vi.stubEnv("ENABLE_FALLBACK", "true");
    vi.stubEnv("FALLBACK_GITHUB_TOKEN", "github_pat_FALLBACK_SECRET_123456");
    // An unusable lookup result sends the route down its catch path.
    loadScoredRepo.mockResolvedValue(undefined);
    const res = await call("a", "missing");
    expect(await res.text()).toContain("not found");
  });
});
