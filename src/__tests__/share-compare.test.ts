import { describe, expect, it } from "vitest";
import { bestIndexes } from "@/lib/compare";
import { parseCompare } from "@/lib/format";
import { defaultPriorities } from "@/lib/prefs";
import { buildShareUrl } from "@/lib/share";

describe("buildShareUrl", () => {
  it("builds a finder link from preferences only", () => {
    const url = buildShareUrl("https://githarvey.vercel.app", { audience: "developer", goal: "build", topic: "pdf", priorities: ["maintained"] });
    expect(url).toBe("https://githarvey.vercel.app/finder?aud=developer&goal=build&q=pdf&pri=maintained");
    expect(url).not.toMatch(/token|github_pat|ghp_/i);
  });
});

describe("parseCompare", () => {
  it("accepts 2-3 valid repos", () => {
    expect(parseCompare("a/b,c/d")).toEqual({ ok: true, names: ["a/b", "c/d"] });
  });
  it("rejects traversal, too few and too many", () => {
    expect(parseCompare("../x,a").ok).toBe(false);
    expect(parseCompare("a/b").ok).toBe(false);
    expect(parseCompare("a/b,c/d,e/f,g/h").ok).toBe(false);
    expect(parseCompare(undefined).ok).toBe(false);
  });
});

describe("helpers", () => {
  it("finds best indexes and ignores nulls", () => {
    expect(bestIndexes([1, 5, 5, null])).toEqual(new Set([1, 2]));
    expect(bestIndexes([null, null]).size).toBe(0);
    expect(bestIndexes([3, 1], "min")).toEqual(new Set([1]));
  });
  it("gives sensible default priorities", () => {
    expect(defaultPriorities("beginner")).toEqual(["beginner-friendly", "maintained"]);
    expect(defaultPriorities("founder")).toEqual(["permissive-license", "maintained"]);
  });
});

import { compareHref } from "@/lib/links";
import { decodeScoring } from "@/lib/prefs";

describe("compareHref and decodeScoring", () => {
  it("carries scoring settings so compare matches the finder", () => {
    const href = compareHref(["a/b", "c/d"], { audience: "security", goal: "learn", priorities: ["maintained", "popular"] });
    const params = new URL(href, "http://x").searchParams;
    expect(params.get("repos")).toBe("a/b,c/d");
    expect(decodeScoring(params)).toEqual({ audience: "security", goal: "learn", priorities: ["maintained", "popular"] });
  });
  it("falls back to developer defaults for missing or bad values", () => {
    expect(decodeScoring(new URLSearchParams("aud=hacker&pri=nope,popular"))).toEqual({ audience: "developer", priorities: ["popular"] });
    expect(decodeScoring(new URLSearchParams(""))).toEqual({ audience: "developer", priorities: [] });
  });
  it("never puts a token in the link", () => {
    expect(compareHref(["a/b", "c/d"], { audience: "developer", priorities: [] })).not.toMatch(/token|github_pat/i);
  });
});
