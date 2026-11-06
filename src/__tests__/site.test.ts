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

describe("site addresses and crawler rules", () => {
  it("builds the site address without a trailing slash, with a local default", async () => {
    const { siteUrl } = await import("@/lib/site");
    const before = process.env.SITE_URL;
    process.env.SITE_URL = "https://githarvey.example/";
    expect(siteUrl()).toBe("https://githarvey.example");
    delete process.env.SITE_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
    if (before !== undefined) process.env.SITE_URL = before;
  });
  it("lists only public pages in the sitemap and keeps token pages out of search", async () => {
    process.env.SITE_URL = "https://githarvey.example";
    const robots = (await import("@/app/robots")).default();
    const sitemap = (await import("@/app/sitemap")).default();
    expect(sitemap.map((s) => s.url)).toEqual([
      "https://githarvey.example",
      "https://githarvey.example/start",
      "https://githarvey.example/privacy",
      "https://githarvey.example/disclaimer",
    ]);
    const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
    expect(rule?.disallow).toEqual(expect.arrayContaining(["/api/", "/finder", "/compare", "/my", "/repo/", "/saved"]));
    expect(robots.sitemap).toBe("https://githarvey.example/sitemap.xml");
    delete process.env.SITE_URL;
  });
});
