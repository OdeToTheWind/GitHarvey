import { describe, expect, it } from "vitest";
import { decodePrefs, encodePrefs } from "@/lib/prefs";
import type { Preferences } from "@/types";

const base: Preferences = {
  audience: "developer",
  goal: "build",
  topic: "pdf parsing",
  language: "python",
  priorities: ["maintained", "popular"],
};

describe("prefs", () => {
  it("round-trips through URL params", () => {
    const result = decodePrefs(encodePrefs(base));
    expect(result).toEqual({ ok: true, prefs: base });
  });

  it("accepts Next-style searchParams objects", () => {
    const result = decodePrefs({
      aud: "beginner",
      goal: "learn",
      q: "rust",
      pri: "maintained",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid audience", () => {
    const params = encodePrefs(base);
    params.set("aud", "wizard");
    expect(decodePrefs(params).ok).toBe(false);
  });

  it("rejects a topic over 80 characters", () => {
    const params = encodePrefs({ ...base, topic: "x".repeat(81) });
    expect(decodePrefs(params).ok).toBe(false);
  });

  it("rejects an empty or whitespace topic", () => {
    const params = encodePrefs(base);
    params.set("q", "   ");
    expect(decodePrefs(params).ok).toBe(false);
  });

  it("deduplicates priorities", () => {
    const params = encodePrefs(base);
    params.set("pri", "popular,popular,maintained");
    const result = decodePrefs(params);
    expect(result.ok && result.prefs.priorities).toEqual(["popular", "maintained"]);
  });

  it("rejects an unknown language", () => {
    const params = encodePrefs(base);
    params.set("lang", "cobol");
    expect(decodePrefs(params).ok).toBe(false);
  });

  it("never throws on garbage input", () => {
    expect(decodePrefs({ aud: ["a", "b"], q: undefined }).ok).toBe(false);
  });
});
