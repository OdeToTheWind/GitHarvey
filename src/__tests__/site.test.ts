import { describe, expect, it } from "vitest";
import { parseRepoUrl } from "@/lib/site";

describe("parseRepoUrl", () => {
  it("accepts a github.com repo URL and trims a trailing slash", () => {
    expect(parseRepoUrl("https://github.com/me/githarvey/")).toBe("https://github.com/me/githarvey");
  });
  it("rejects other hosts, schemes and shapes", () => {
    expect(parseRepoUrl("https://evil.example/me/githarvey")).toBeNull();
    expect(parseRepoUrl("http://github.com/me/githarvey")).toBeNull();
    expect(parseRepoUrl("javascript:alert(1)")).toBeNull();
    expect(parseRepoUrl("https://github.com/me")).toBeNull();
    expect(parseRepoUrl("https://github.com/me/repo/tree/x")).toBeNull();
    expect(parseRepoUrl(undefined)).toBeNull();
    expect(parseRepoUrl("")).toBeNull();
  });
});
