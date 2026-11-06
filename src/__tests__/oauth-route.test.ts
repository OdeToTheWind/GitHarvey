import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
      if (options?.maxAge === 0) jar.delete(name);
      else jar.set(name, { value, options });
    },
  }),
}));

const validateToken = vi.fn();
vi.mock("@/lib/github", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/github")>()),
  validateToken: (t: string) => validateToken(t),
}));

import { GET as callback } from "@/app/api/auth/github/callback/route";
import { GET as start } from "@/app/api/auth/github/route";
import { authorizeUrl, isPlausibleCode, sameState } from "@/lib/oauth";
import { resetRateLimits } from "@/lib/ratelimit";

const HOST = "https://githarvey.test";
const ACCESS_TOKEN = "gho_ACCESS_TOKEN_VALUE_1234567890";
let ip = 0;
const get = (path: string, route: typeof start) => {
  ip += 1;
  return route(new Request(`${HOST}${path}`, { headers: { "x-forwarded-for": `10.3.0.${ip}` } }));
};

beforeEach(() => {
  jar.clear();
  validateToken.mockReset();
  resetRateLimits();
  vi.stubEnv("SESSION_SECRET", "s".repeat(40));
  vi.stubEnv("GITHUB_CLIENT_ID", "client-id-123");
  vi.stubEnv("GITHUB_CLIENT_SECRET", "client-secret-456");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function begin(next?: string) {
  const res = await get(`/api/auth/github${next ? `?next=${encodeURIComponent(next)}` : ""}`, start);
  const target = new URL(res.headers.get("location") ?? "");
  return { res, target, state: target.searchParams.get("state") ?? "" };
}

describe("GET /api/auth/github", () => {
  it("sends the visitor to GitHub with a random state, a callback on this site and no scope", async () => {
    const { res, target, state } = await begin();
    expect(res.status).toBe(302);
    expect(target.origin + target.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(target.searchParams.get("client_id")).toBe("client-id-123");
    expect(target.searchParams.get("redirect_uri")).toBe(`${HOST}/api/auth/github/callback`);
    expect(target.searchParams.has("scope")).toBe(false);
    expect(state.length).toBeGreaterThan(30);
    expect(target.toString()).not.toContain("client-secret-456");
    expect(jar.get("rf_oauth")?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/api/auth" });
  });
  it("uses a new state every time", async () => {
    expect((await begin()).state).not.toBe((await begin()).state);
  });
  it("goes back to the start page when sign-in is not set up", async () => {
    vi.stubEnv("GITHUB_CLIENT_SECRET", "");
    const res = await get("/api/auth/github", start);
    expect(new URL(res.headers.get("location") ?? "").pathname + new URL(res.headers.get("location") ?? "").search).toBe("/start?error=oauth-off");
  });
});

describe("GET /api/auth/github/callback", () => {
  const mockExchange = (body: unknown, ok = true) => {
    const fn = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: ok ? 200 : 500 }));
    vi.stubGlobal("fetch", fn);
    return fn;
  };
  const failure = (res: Response) => new URL(res.headers.get("location") ?? "").pathname + new URL(res.headers.get("location") ?? "").search;

  it("stores the token in the encrypted cookie and returns to the page the visitor came from", async () => {
    const { state } = await begin("/finder?aud=developer&goal=build&q=pdf");
    const fetchFn = mockExchange({ access_token: ACCESS_TOKEN });
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 5000, resetAt: null } });

    const res = await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(state)}`, callback);
    expect(failure(res)).toBe("/finder?aud=developer&goal=build&q=pdf");
    const sent = JSON.parse(String(fetchFn.mock.calls[0]?.[1].body));
    expect(sent).toMatchObject({ client_id: "client-id-123", code: "abcdefghij1234", redirect_uri: `${HOST}/api/auth/github/callback` });
    expect(fetchFn.mock.calls[0]?.[0]).toBe("https://github.com/login/oauth/access_token");
    const session = jar.get("rf_session");
    expect(session?.options).toMatchObject({ httpOnly: true, sameSite: "lax" });
    expect(session?.value).not.toContain(ACCESS_TOKEN);
    expect(res.headers.get("location")).not.toContain(ACCESS_TOKEN);
  });
  it("rejects a callback whose state does not match, without asking GitHub for a token", async () => {
    await begin();
    const fetchFn = mockExchange({ access_token: ACCESS_TOKEN });
    const res = await get("/api/auth/github/callback?code=abcdefghij1234&state=forged", callback);
    expect(failure(res)).toBe("/start?error=oauth-state");
    expect(fetchFn).not.toHaveBeenCalled();
    expect(jar.has("rf_session")).toBe(false);
  });
  it("cannot be replayed: the state is used up by the first callback", async () => {
    const { state } = await begin();
    mockExchange({ access_token: ACCESS_TOKEN });
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 1, resetAt: null } });
    await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(state)}`, callback);
    jar.delete("rf_session");
    const again = await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(state)}`, callback);
    expect(failure(again)).toBe("/start?error=oauth-state");
    expect(jar.has("rf_session")).toBe(false);
  });
  it("rejects a callback with no state cookie, a bad code, or a failed exchange", async () => {
    expect(failure(await get("/api/auth/github/callback?code=abcdefghij1234&state=x", callback))).toBe("/start?error=oauth-state");
    const { state } = await begin();
    expect(failure(await get(`/api/auth/github/callback?code=!!&state=${encodeURIComponent(state)}`, callback))).toBe("/start?error=oauth-state");
    const second = await begin();
    mockExchange({ error: "incorrect_client_credentials" });
    expect(failure(await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(second.state)}`, callback))).toBe("/start?error=oauth-exchange&why=incorrect_client_credentials");
    expect(jar.has("rf_session")).toBe(false);
  });
  it("refuses a token that carries permissions, like a pasted classic token", async () => {
    const { state } = await begin();
    mockExchange({ access_token: ACCESS_TOKEN });
    validateToken.mockResolvedValue({ valid: true, scopes: ["repo"], rate: { remaining: 1, resetAt: null } });
    expect(failure(await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(state)}`, callback))).toBe("/start?error=oauth-scope");
    expect(jar.has("rf_session")).toBe(false);
  });
  it("ignores a next address that leaves the site", async () => {
    const { state } = await begin("https://evil.test/");
    mockExchange({ access_token: ACCESS_TOKEN });
    validateToken.mockResolvedValue({ valid: true, scopes: [], rate: { remaining: 1, resetAt: null } });
    expect(failure(await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(state)}`, callback))).toBe("/start");
  });
});

describe("sign-in problems say which step failed", () => {
  it("tells apart a cancelled sign-in, a refused token and GitHub being unreachable", async () => {
    const { state } = await begin();
    expect(failure0(await get(`/api/auth/github/callback?error=access_denied&state=${encodeURIComponent(state)}`, callback))).toBe("/start?error=oauth-denied");
    const next = await begin();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify({ access_token: ACCESS_TOKEN }))));
    validateToken.mockResolvedValue({ valid: false, scopes: [], rate: { remaining: null, resetAt: null } });
    expect(failure0(await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(next.state)}`, callback))).toBe("/start?error=oauth-github");
    const last = await begin();
    validateToken.mockRejectedValue(new Error("network"));
    expect(failure0(await get(`/api/auth/github/callback?code=abcdefghij1234&state=${encodeURIComponent(last.state)}`, callback))).toBe("/start?error=oauth-github");
  });
});

const failure0 = (res: Response) => new URL(res.headers.get("location") ?? "").pathname + new URL(res.headers.get("location") ?? "").search;

describe("why GitHub refused the exchange", () => {
  const exchange = async (body: unknown, status = 200) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response(JSON.stringify(body), { status })));
    const { exchangeCode } = await import("@/lib/oauth");
    return exchangeCode({ clientId: "id", clientSecret: "secret" }, "abcdefghij1234", "https://a.test/cb");
  };
  it("names GitHub's known reasons and nothing else", async () => {
    expect(await exchange({ error: "incorrect_client_credentials" })).toEqual({ ok: false, reason: "incorrect_client_credentials" });
    expect(await exchange({ error: "bad_verification_code" })).toEqual({ ok: false, reason: "bad_verification_code" });
    expect(await exchange({ error: "redirect_uri_mismatch" })).toEqual({ ok: false, reason: "redirect_uri_mismatch" });
    expect(await exchange({ error: "<script>alert(1)</script>" })).toEqual({ ok: false, reason: "other" });
    expect(await exchange({}, 500)).toEqual({ ok: false, reason: "http" });
  });
  it("reports an unreachable GitHub, and returns the token on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    const { exchangeCode } = await import("@/lib/oauth");
    expect(await exchangeCode({ clientId: "id", clientSecret: "secret" }, "abcdefghij1234", "https://a.test/cb")).toEqual({ ok: false, reason: "network" });
    expect(await exchange({ access_token: ACCESS_TOKEN })).toEqual({ ok: true, token: ACCESS_TOKEN });
  });
});

describe("oauth helpers", () => {
  it("compares states without accepting empty or different values", () => {
    expect(sameState("abc", "abc")).toBe(true);
    expect(sameState("abc", "abd")).toBe(false);
    expect(sameState("abc", "abcd")).toBe(false);
    expect(sameState(null, "abc")).toBe(false);
    expect(sameState("abc", null)).toBe(false);
  });
  it("accepts only code-shaped values", () => {
    expect(isPlausibleCode("a1b2c3d4e5f6")).toBe(true);
    for (const bad of [null, "", "short", "has space in it!!", "x".repeat(101)]) expect(isPlausibleCode(bad)).toBe(false);
  });
  it("builds the authorize address from the settings it is given", () => {
    const url = new URL(authorizeUrl({ clientId: "id", clientSecret: "secret" }, "https://a.test/cb", "st"));
    expect(url.searchParams.get("state")).toBe("st");
    expect(url.search).not.toContain("secret");
  });
});

describe("test-only sign-in address", () => {
  it("is ignored in production and for any address that is not this machine", () => {
    vi.stubEnv("GITHARVEY_GITHUB_OAUTH", "http://localhost:4010");
    vi.stubEnv("NODE_ENV", "production");
    expect(authorizeUrl({ clientId: "id", clientSecret: "s" }, "https://a.test/cb", "st")).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GITHARVEY_GITHUB_OAUTH", "https://evil.example");
    expect(authorizeUrl({ clientId: "id", clientSecret: "s" }, "https://a.test/cb", "st")).toMatch(/^https:\/\/github\.com\//);
  });
  it("lets a local fake stand in for GitHub outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GITHARVEY_GITHUB_OAUTH", "http://127.0.0.1:4010");
    expect(authorizeUrl({ clientId: "id", clientSecret: "s" }, "https://a.test/cb", "st")).toMatch(/^http:\/\/127\.0\.0\.1:4010\/login\/oauth\/authorize\?/);
  });
});
