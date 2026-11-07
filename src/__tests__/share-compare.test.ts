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
  const names = (n: number) => Array.from({ length: n }, (_, i) => `o/r${i}`).join(",");
  it("accepts 2 to 10 valid repos", () => {
    expect(parseCompare("a/b,c/d")).toEqual({ ok: true, names: ["a/b", "c/d"] });
    expect(parseCompare(names(10)).ok).toBe(true);
  });
  it("rejects traversal and too few, and says why", () => {
    expect(parseCompare("../x,a")).toEqual({ ok: false, reason: "invalid" });
    expect(parseCompare("a/b")).toEqual({ ok: false, reason: "too-few" });
    expect(parseCompare(undefined)).toEqual({ ok: false, reason: "too-few" });
  });
  it("rejects an 11th repo, with its own reason", () => {
    expect(parseCompare(names(11))).toEqual({ ok: false, reason: "too-many" });
    expect(parseCompare(`${names(10)},o/r0`).ok).toBe(true); // a repeat is not a new repo
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
