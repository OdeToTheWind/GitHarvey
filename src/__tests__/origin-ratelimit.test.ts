import { beforeEach, describe, expect, it } from "vitest";
import { isSameOrigin } from "@/lib/origin";
import { allow, resetRateLimits } from "@/lib/ratelimit";

const req = (headers: Record<string, string>) => new Request("https://githarvey.test/api/session", { method: "POST", headers });

describe("isSameOrigin", () => {
  it("accepts a matching origin and rejects missing or foreign ones", () => {
    expect(isSameOrigin(req({ origin: "https://githarvey.test", host: "githarvey.test" }))).toBe(true);
    expect(isSameOrigin(req({ host: "githarvey.test" }))).toBe(false);
    expect(isSameOrigin(req({ origin: "https://evil.test", host: "githarvey.test" }))).toBe(false);
    expect(isSameOrigin(req({ origin: "not a url", host: "githarvey.test" }))).toBe(false);
  });
});

describe("allow", () => {
  beforeEach(() => resetRateLimits());
  it("limits within a window and resets after it", () => {
    expect(allow("k", 2, 1000, 0)).toBe(true);
    expect(allow("k", 2, 1000, 1)).toBe(true);
    expect(allow("k", 2, 1000, 2)).toBe(false);
    expect(allow("k", 2, 1000, 1001)).toBe(true);
  });
});
