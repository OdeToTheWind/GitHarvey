import { describe, expect, it } from "vitest";
import { LICENSE_LABELS, LICENSE_NOTES, licenseKind } from "@/lib/licenses";

describe("licenseKind", () => {
  it("groups common licenses", () => {
    expect(licenseKind("MIT")).toBe("permissive");
    expect(licenseKind("Apache-2.0")).toBe("permissive");
    expect(licenseKind("MPL-2.0")).toBe("weak-copyleft");
    expect(licenseKind("LGPL-3.0")).toBe("weak-copyleft");
    expect(licenseKind("GPL-3.0")).toBe("strong-copyleft");
    expect(licenseKind("AGPL-3.0")).toBe("strong-copyleft");
    expect(licenseKind("BUSL-1.1")).toBe("restricted");
    expect(licenseKind("Other")).toBe("custom");
    expect(licenseKind(null)).toBe("none");
  });
  it("has a label and a note for every kind, and the notes never promise legal safety", () => {
    for (const kind of Object.keys(LICENSE_LABELS) as (keyof typeof LICENSE_LABELS)[]) {
      expect(LICENSE_LABELS[kind].length).toBeGreaterThan(2);
      expect(LICENSE_NOTES[kind]).not.toMatch(/guarantee|safe to use|legal advice/i);
    }
  });
});
