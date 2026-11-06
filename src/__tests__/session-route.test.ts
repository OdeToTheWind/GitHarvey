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
      if (options?.maxAge === 0) jar.delete(name);
      else jar.set(name, { value, options });
    },
  }),
}));

import * as sessionRoute from "@/app/api/session/route";
import { setToken } from "@/lib/session";

const TOKEN = "gho_SECRET_VALUE_1234567890abcdef";
const HOST = "githarvey.test";
const { GET, DELETE } = sessionRoute;

beforeEach(() => {
  jar.clear();
  vi.stubEnv("SESSION_SECRET", "s".repeat(40));
});

describe("the session cookie", () => {
  it("holds the token encrypted, httpOnly, and never in readable text", async () => {
    await setToken(TOKEN, false);
    const cookie = jar.get("rf_session");
    expect(cookie?.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(cookie?.value).not.toContain(TOKEN);
  });
  it("expires: 12 hours by default, 7 days with remember", async () => {
    await setToken(TOKEN, false);
    const short = Number(jar.get("rf_session")?.options.maxAge);
    expect(short).toBeGreaterThan(11 * 3600);
    expect(short).toBeLessThanOrEqual(12 * 3600);
    jar.clear();
    await setToken(TOKEN, true);
    const long = Number(jar.get("rf_session")?.options.maxAge);
    expect(long).toBeGreaterThan(6 * 86400);
    expect(long).toBeLessThanOrEqual(7 * 86400);
  });
});

describe("/api/session", () => {
  it("no longer accepts a pasted token: signing in is only through GitHub", () => {
    expect("POST" in sessionRoute).toBe(false);
  });
  it("reports whether you are signed in and signs you out", async () => {
    expect(await (await GET()).json()).toEqual({ hasToken: false });
    await setToken(TOKEN, false);
    expect(await (await GET()).json()).toEqual({ hasToken: true });
    const res = await DELETE(new Request(`https://${HOST}/api/session`, { method: "DELETE", headers: { host: HOST, origin: `https://${HOST}` } }));
    expect(res.status).toBe(200);
    expect(await (await GET()).json()).toEqual({ hasToken: false });
  });
  it("blocks DELETE from another origin", async () => {
    const res = await DELETE(new Request(`https://${HOST}/api/session`, { method: "DELETE", headers: { host: HOST, origin: "https://evil.test" } }));
    expect(res.status).toBe(403);
  });
});
