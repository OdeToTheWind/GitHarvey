import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearPrefs, getPrefs, setPrefs } from "@/lib/storage";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}
const prefs = { audience: "developer", goal: "build", topic: "pdf", priorities: ["maintained"] } as const;

beforeEach(() => vi.stubGlobal("localStorage", new MemoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("prefs storage", () => {
  it("round-trips preferences", () => {
    setPrefs({ ...prefs, priorities: [...prefs.priorities] });
    expect(getPrefs()).toEqual({ ...prefs, priorities: ["maintained"] });
  });
  it("clears", () => {
    setPrefs({ ...prefs, priorities: [] });
    clearPrefs();
    expect(getPrefs()).toBeNull();
  });
  it("ignores garbage and survives blocked storage", () => {
    localStorage.setItem("ghv_prefs", "aud=hacker");
    expect(getPrefs()).toBeNull();
    const blocked = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
    vi.stubGlobal("localStorage", blocked);
    expect(getPrefs()).toBeNull();
    expect(() => setPrefs({ ...prefs, priorities: [] })).not.toThrow();
    expect(() => clearPrefs()).not.toThrow();
  });
  it("never stores a token", () => {
    setPrefs({ ...prefs, priorities: [] });
    expect(JSON.stringify(Object.entries(localStorage as unknown as MemoryStorage))).not.toMatch(/github_pat|token/i);
  });
});
