import { describe, expect, it } from "vitest";
import { DISCLAIMER_SECTIONS } from "@/app/disclaimer/sections";

const all = DISCLAIMER_SECTIONS.map((s) => `${s.title} ${s.text}`).join(" ");

describe("disclaimer", () => {
  it("covers the points a visitor needs", () => {
    for (const phrase of ["not affiliated", "only after you act", "rate limit", "not an audit", "Terms of Service", "repository is public", "without warranty"]) {
      expect(all.toLowerCase(), phrase).toContain(phrase.toLowerCase());
    }
  });
  it("never promises results or safety", () => {
    expect(all).not.toMatch(/guarantee[sd]? (that|a|the)/i);
    expect(all).toMatch(/not an audit/);
  });
  it("has unique titles and a picture for each", () => {
    expect(new Set(DISCLAIMER_SECTIONS.map((s) => s.title)).size).toBe(DISCLAIMER_SECTIONS.length);
    expect(DISCLAIMER_SECTIONS.every((s) => s.icon)).toBe(true);
  });
});
