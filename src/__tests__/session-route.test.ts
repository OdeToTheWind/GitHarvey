import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredCookie = { value: string; options: Record<string, unknown> };
const jar = new Map<string, StoredCookie>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const found = jar.get(name);
      return found ? { name, value: found.value } : undefined;
    },
    getAll: () => Array.from(jar, ([name, c]) => ({ name, value: c.value })),
    set: (name: string, value: string, options: Record<string, unknown>) => {
      jar.set(name, { value, options });
    },
  }),
}));

const validateToken = vi.fn();
vi.mock("@/lib/github", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github")>()),
  validateToken: (t: string) => validateToken(t),
}));

import { DELETE, GET, POST } from "@/app/api/session/route";
import { resetRateLimits } from "@/lib/ratelimit";

const TOKEN = "github_pat_SECRET_VALUE_1234567890";
const HOST = "githarvey.test";
let ip = 0;

function post(body: unknown, headers: Record<string, string> = {}) {
  ip += 1;
  return POST(
    new Request(`https://${HOST}/api/session`, {
      method: "POST",
      headers: { host: HOST, origin: `https://${HOST}`, "content-type": "application/json", "x-forwarded-for": `10.0.0.${ip}`, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  jar.clear();
  validateToken.mockReset();
  resetRateLimits();
  vi.stubEnv("SESSION_SECRET", "s".repeat(40));
});

describe("POST /api/session", () => {
  it("stores a valid fine-grained token in an httpOnly cookie, never in the body", async () => {
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 5000, resetAt: null } });
    const res = await post({ token: TOKEN, remember: false });
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).not.toContain(TOKEN);
    const cookie = jar.get("rf_session");
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(cookie?.value).not.toContain(TOKEN);
  });

  it("expires the session: 12 hours by default, 7 days with remember", async () => {
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 5000, resetAt: null } });
    await post({ token: TOKEN, remember: false });
    const short = Number(jar.get("rf_session")?.options.maxAge);
    expect(short).toBeGreaterThan(11 * 3600);
    expect(short).toBeLessThanOrEqual(12 * 3600);
    jar.clear();
    await post({ token: TOKEN, remember: true });
    const long = Number(jar.get("rf_session")?.options.maxAge);
    expect(long).toBeGreaterThan(6 * 86400);
    expect(long).toBeLessThanOrEqual(7 * 86400);
  });

  it("rejects classic tokens that carry scopes", async () => {
    validateToken.mockResolvedValue({ valid: true, scopes: ["repo"], rate: { remaining: 1, resetAt: null } });
    const res = await post({ token: TOKEN });
    expect(res.status).toBe(400);
    expect(jar.size).toBe(0);
  });

  it("rejects tokens GitHub refuses", async () => {
    validateToken.mockResolvedValue({ valid: false, scopes: [], rate: { remaining: null, resetAt: null } });
    expect((await post({ token: TOKEN })).status).toBe(401);
  });

  it("rejects a bad origin, bad JSON and bad input", async () => {
    expect((await post({ token: TOKEN }, { origin: "https://evil.test" })).status).toBe(403);
    expect((await post("{nope")).status).toBe(400);
    expect((await post({ token: "short" })).status).toBe(400);
    expect(validateToken).not.toHaveBeenCalled();
  });

  it("rate limits repeated attempts from one address", async () => {
    validateToken.mockResolvedValue({ valid: false, scopes: [], rate: { remaining: null, resetAt: null } });
    let last = 200;
    for (let i = 0; i < 11; i += 1) {
      last = (await post({ token: TOKEN }, { "x-forwarded-for": "9.9.9.9" })).status;
    }
    expect(last).toBe(429);
  });
});

describe("GET and DELETE /api/session", () => {
  it("reports whether a token exists and clears it", async () => {
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 1, resetAt: null } });
    expect(await (await GET()).json()).toEqual({ hasToken: false });
    await post({ token: TOKEN });
    expect(await (await GET()).json()).toEqual({ hasToken: true });
    const res = await DELETE(new Request(`https://${HOST}/api/session`, { method: "DELETE", headers: { host: HOST, origin: `https://${HOST}` } }));
    expect(res.status).toBe(200);
  });

  it("blocks DELETE from another origin", async () => {
    const res = await DELETE(new Request(`https://${HOST}/api/session`, { method: "DELETE", headers: { host: HOST, origin: "https://evil.test" } }));
    expect(res.status).toBe(403);
  });
});
