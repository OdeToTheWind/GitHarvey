import { describe, expect, it } from "vitest";
import { ago } from "@/lib/format";

describe("ago", () => {
  const now = Date.parse("2026-11-02T00:00:00Z");
  it("formats ages", () => {
    expect(ago("2026-11-02T00:00:00Z", now)).toBe("today");
    expect(ago("2026-10-30T00:00:00Z", now)).toBe("3 days ago");
    expect(ago("2026-05-02T00:00:00Z", now)).toBe("6 months ago");
    expect(ago("2022-11-02T00:00:00Z", now)).toBe("4 years ago");
  });
  it("handles missing and bad dates", () => {
    expect(ago(null, now)).toBe("never");
    expect(ago("not a date", now)).toBe("unknown");
  });
});
