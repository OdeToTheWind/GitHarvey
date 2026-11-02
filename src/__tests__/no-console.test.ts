import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

describe("log audit", () => {
  it("has no console.* calls in src/lib or src/app/api", () => {
    const root = path.resolve(__dirname, "..");
    const files = [...walk(path.join(root, "lib")), ...walk(path.join(root, "app/api"))].filter(
      (file) => /\.(ts|tsx)$/.test(file),
    );
    const offenders = files.filter((file) =>
      /console\.(log|error|warn|info|debug)/.test(fs.readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("marks token-handling lib files server-only", () => {
    const root = path.resolve(__dirname, "../lib");
    for (const name of ["github.ts", "github-errors.ts", "github-map.ts", "session.ts", "origin.ts", "ratelimit.ts", "cache.ts", "search.ts", "api.ts", "errors.ts"]) {
      const text = fs.readFileSync(path.join(root, name), "utf8");
      expect(text.startsWith('import "server-only";'), name).toBe(true);
    }
  });

  it("keeps token handling out of URLs and the GitHub client free of other origins", () => {
    const root = path.resolve(__dirname, "../lib");
    const github = fs.readFileSync(path.join(root, "github.ts"), "utf8");
    expect(github.match(/https?:\/\/[^\s"'`]+/g)).toEqual(["https://api.github.com"]);
    for (const file of walk(root)) {
      const text = fs.readFileSync(file, "utf8");
      expect(text).not.toMatch(/dangerouslySetInnerHTML|eval\(/);
    }
  });
});
