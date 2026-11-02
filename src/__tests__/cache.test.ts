import { beforeEach, describe, expect, it, vi } from "vitest";
import { cached, clearCache } from "@/lib/cache";

beforeEach(() => clearCache());

describe("cached", () => {
  it("avoids a second load within the TTL", async () => {
    const load = vi.fn().mockResolvedValue(1);
    await cached("/a", load, 1000);
    await cached("/a", load, 2000);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("reloads after expiry", async () => {
    const load = vi.fn().mockResolvedValue(1);
    await cached("/a", load, 1000);
    await cached("/a", load, 1000 + 11 * 60 * 1000);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it("dedupes in-flight requests", async () => {
    const load = vi.fn().mockResolvedValue(1);
    await Promise.all([cached("/a", load), cached("/a", load)]);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("does not cache errors", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce(2);
    await expect(cached("/a", load)).rejects.toThrow();
    expect(await cached("/a", load)).toBe(2);
  });
  it("rejects keys that are not request paths", async () => {
    await expect(cached("Bearer abc", async () => 1)).rejects.toThrow();
    await expect(cached("github_pat_x y", async () => 1)).rejects.toThrow();
  });
});
