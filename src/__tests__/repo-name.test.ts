import { describe, expect, it } from "vitest";
import { isValidRepoName } from "@/lib/repoName";

describe("isValidRepoName", () => {
  it("accepts normal names and rejects traversal", () => {
    expect(isValidRepoName("vercel/next.js")).toBe(true);
    expect(isValidRepoName("a/b")).toBe(true);
    expect(isValidRepoName("../x")).toBe(false);
    expect(isValidRepoName("x/..")).toBe(false);
    expect(isValidRepoName("a/b/c")).toBe(false);
    expect(isValidRepoName("a b/c")).toBe(false);
  });
});
