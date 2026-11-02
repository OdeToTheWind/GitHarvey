import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("getEnv", () => {
  it("accepts a valid secret and defaults the fallback off", () => {
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    expect(getEnv().ENABLE_FALLBACK).toBe(false);
  });
  it("names the bad key without printing its value", () => {
    vi.stubEnv("SESSION_SECRET", "too-short-secret");
    expect(() => getEnv()).toThrow(/SESSION_SECRET/);
    try {
      getEnv();
    } catch (error) {
      expect(String(error)).not.toContain("too-short-secret");
    }
  });
});
