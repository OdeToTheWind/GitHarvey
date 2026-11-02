import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, getAll: () => [], set: () => {} }) }));
const loadRelease = vi.fn();
vi.mock("@/lib/search", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/search")>()),
  loadRelease: (...a: unknown[]) => loadRelease(...a),
}));

import { GET } from "@/app/api/release/route";
import { resetRateLimits } from "@/lib/ratelimit";

let ip = 0;
const call = (name: string) => {
  ip += 1;
  return GET(new Request(`https://githarvey.test/api/release?name=${encodeURIComponent(name)}`, { headers: { "x-forwarded-for": `10.1.0.${ip}` } }));
};

beforeEach(() => {
  resetRateLimits();
  loadRelease.mockReset();
  vi.stubEnv("SESSION_SECRET", "s".repeat(40));
  vi.stubEnv("ENABLE_FALLBACK", "false");
});

describe("GET /api/release", () => {
  it("rejects bad repo names before any lookup", async () => {
    expect((await call("../x")).status).toBe(400);
    expect((await call("a/b/c")).status).toBe(400);
    expect(loadRelease).not.toHaveBeenCalled();
  });
  it("asks for a token when there is none and no fallback", async () => {
    expect((await call("a/b")).status).toBe(401);
  });
  it("uses the fallback token when the host enabled it, and never returns it", async () => {
    vi.stubEnv("ENABLE_FALLBACK", "true");
    vi.stubEnv("FALLBACK_GITHUB_TOKEN", "github_pat_FALLBACK_SECRET_123456");
    loadRelease.mockResolvedValue({ lastReleaseAt: null });
    const res = await call("a/b");
    expect(res.status).toBe(200);
    expect(loadRelease).toHaveBeenCalledWith("a/b", "github_pat_FALLBACK_SECRET_123456");
    expect(JSON.stringify(await res.json())).not.toContain("FALLBACK_SECRET");
  });
});
