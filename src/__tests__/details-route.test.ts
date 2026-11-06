import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionToken: { value: string | null } = { value: null };
vi.mock("@/lib/session", () => ({ readToken: async () => ({ configured: true, token: sessionToken.value }) }));
const loadDetails = vi.fn();
vi.mock("@/lib/search", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/search")>()),
  loadDetails: (...a: unknown[]) => loadDetails(...a),
}));

import { GET } from "@/app/api/details/route";
import { resetRateLimits } from "@/lib/ratelimit";

let ip = 0;
const call = (name: string) => {
  ip += 1;
  return GET(new Request(`https://githarvey.test/api/details?name=${encodeURIComponent(name)}`, { headers: { "x-forwarded-for": `10.1.0.${ip}` } }));
};

beforeEach(() => {
  resetRateLimits();
  loadDetails.mockReset();
  sessionToken.value = null;
});

describe("GET /api/details", () => {
  it("rejects bad repo names before any lookup", async () => {
    expect((await call("../x")).status).toBe(400);
    expect((await call("a/b/c")).status).toBe(400);
    expect(loadDetails).not.toHaveBeenCalled();
  });
  it("asks for a token when there is none", async () => {
    expect((await call("a/b")).status).toBe(401);
    expect(loadDetails).not.toHaveBeenCalled();
  });
  it("looks up with the visitor's own token and never returns it", async () => {
    sessionToken.value = "github_pat_VISITOR_SECRET_123456";
    loadDetails.mockResolvedValue({ health: { lastReleaseAt: null, checked: true }, extras: { contributors: 7 } });
    const res = await call("a/b");
    expect(res.status).toBe(200);
    expect(loadDetails).toHaveBeenCalledWith("a/b", "github_pat_VISITOR_SECRET_123456");
    expect(JSON.stringify(await res.json())).not.toContain("VISITOR_SECRET");
  });
});
