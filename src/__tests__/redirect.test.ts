import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/redirect";

describe("safeNext", () => {
  it("allows our own result pages with their query", () => {
    expect(safeNext("/finder?aud=developer&q=pdf")).toBe("/finder?aud=developer&q=pdf");
    expect(safeNext("/compare?repos=a%2Fb%2Cc%2Fd")).toBe("/compare?repos=a%2Fb%2Cc%2Fd");
    expect(safeNext("/my?aud=founder")).toBe("/my?aud=founder");
  });
  it("rejects anything that could leave the site or reach another page", () => {
    for (const bad of ["//evil.test", "https://evil.test/finder", "/\\evil.test", "/start", "/api/session", "javascript:alert(1)", "/finder/../start", "", null, undefined, "/finder\n"]) {
      expect(safeNext(bad as string | null | undefined), String(bad)).toBeNull();
    }
    expect(safeNext(`/finder?q=${"a".repeat(600)}`)).toBeNull();
  });
});
