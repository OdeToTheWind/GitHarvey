import { describe, expect, it } from "vitest";
import { alternativesHref, topicFromRepo } from "@/lib/alternatives";
import { repoHref, signInHref } from "@/lib/links";
import { decodePrefs } from "@/lib/prefs";
import { safeNext } from "@/lib/redirect";
import { toggleStyle } from "@/lib/topic-styles";
import type { RepoSummary } from "@/types";

const repo: RepoSummary = {
  id: 1, fullName: "acme/pdf-toolkit", description: null, url: "https://github.com/acme/pdf-toolkit", stars: 1, forks: 0, openIssues: 0,
  language: "C++", license: null, pushedAt: "2020-01-01T00:00:00Z", createdAt: "2019-01-01T00:00:00Z", topics: ["pdf-parser", "ocr", "cli"], archived: true, homepage: null, sizeKb: 1,
};

describe("alternatives", () => {
  it("builds a finder link that decodes, leaves the repo out and keeps the scoring settings", () => {
    const href = alternativesHref(repo, { audience: "founder", priorities: ["permissive-license"] });
    const url = new URL(href, "https://githarvey.test");
    expect(url.pathname).toBe("/finder");
    expect(url.searchParams.get("not")).toBe("acme/pdf-toolkit");
    const decoded = decodePrefs(url.searchParams);
    expect(decoded.ok && decoded.prefs).toMatchObject({ audience: "founder", goal: "compare", topic: "pdf parser ocr", language: "cpp", priorities: ["permissive-license"] });
  });
  it("falls back to the repo name when there are no topics", () => {
    expect(topicFromRepo({ ...repo, topics: [] })).toBe("pdf toolkit");
  });
  it("leaves the language off when it is not one we can filter by", () => {
    const url = new URL(alternativesHref({ ...repo, language: "Haskell" }, { audience: "developer", priorities: [] }), "https://x.test");
    expect(url.searchParams.has("lang")).toBe(false);
  });
});

describe("repo links", () => {
  it("builds a detail link with only the name and scoring settings", () => {
    expect(repoHref("a/b")).toBe("/repo/a/b");
    expect(repoHref("a/b", { audience: "security", priorities: ["maintained"] })).toBe("/repo/a/b?aud=security&pri=maintained");
  });
  it("lets a visitor come back to a detail page after adding a token, and nothing else", () => {
    expect(safeNext("/repo/a/b?aud=security")).toBe("/repo/a/b?aud=security");
    for (const bad of ["/repo/a", "/repo/a/b/c", "/repo/../start", "/repo//evil.test", "/repo/a b/c", "/saved", "/repo/%2e%2e/x"]) {
      expect(safeNext(bad), bad).toBeNull();
    }
  });
});

describe("topic styles", () => {
  it("adds and removes a style word without mangling the topic", () => {
    expect(toggleStyle("pdf parsing", "starter kit")).toBe("pdf parsing starter kit");
    expect(toggleStyle("pdf parsing starter kit", "starter kit")).toBe("pdf parsing");
    expect(toggleStyle("", "tutorial")).toBe("tutorial");
  });
  it("never goes past 80 characters", () => {
    const long = "x".repeat(75);
    expect(toggleStyle(long, "boilerplate")).toBe(long);
  });
});

describe("sign-in link", () => {
  it("returns to one of our own pages, and encodes it", () => {
    expect(signInHref()).toBe("/api/auth/github");
    expect(signInHref("/compare?repos=a%2Fb%2Cc%2Fd")).toBe("/api/auth/github?next=%2Fcompare%3Frepos%3Da%252Fb%252Cc%252Fd");
  });
});
