import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearShortlist, getShortlistRaw, parseShortlist, toggleSaved } from "@/lib/shortlist";

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

beforeEach(() => vi.stubGlobal("localStorage", new MemoryStorage()));
afterEach(() => vi.unstubAllGlobals());

describe("shortlist", () => {
  it("saves, removes and clears repo names", () => {
    toggleSaved("a/b");
    toggleSaved("c/d");
    expect(parseShortlist(getShortlistRaw())).toEqual(["a/b", "c/d"]);
    toggleSaved("a/b");
    expect(parseShortlist(getShortlistRaw())).toEqual(["c/d"]);
    clearShortlist();
    expect(getShortlistRaw()).toBeNull();
  });
  it("ignores bad names and duplicates in stored text", () => {
    expect(parseShortlist("a/b,../x,a/b,not-a-repo,c/d")).toEqual(["a/b", "c/d"]);
    toggleSaved("../x");
    expect(getShortlistRaw()).toBeNull();
  });
  it("caps the list and survives blocked storage", () => {
    for (let i = 0; i < 40; i += 1) toggleSaved(`o/r${i}`);
    expect(parseShortlist(getShortlistRaw())).toHaveLength(30);
    vi.stubGlobal("localStorage", { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } });
    expect(() => toggleSaved("a/b")).not.toThrow();
    expect(getShortlistRaw()).toBeNull();
  });
});
