// A tiny stand-in for api.github.com (and GitHub's sign-in pages), used only by the browser tests. It answers the handful of
// endpoints GitHarvey calls, with fixed data, and counts requests so tests can check that the
// visitor's token is only ever sent to "GitHub".
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_GITHUB_PORT ?? 4010);
const DAY = 86_400_000;
const iso = (daysAgo) => new Date(Date.now() - daysAgo * DAY).toISOString();

const repo = (id, name, o) => ({
  id, full_name: `acme/${name}`, description: `${name} is a fixture repo`, html_url: `https://github.com/acme/${name}`,
  stargazers_count: 100, forks_count: 10, open_issues_count: 5, language: "JavaScript", license: { spdx_id: "MIT" },
  pushed_at: iso(5), created_at: iso(900), topics: ["pdf", "parser"], archived: false, homepage: "https://example.dev", size: 800, ...o,
});
const REPOS = [
  repo(1, "alpha", { stargazers_count: 5200, forks_count: 300, open_issues_count: 40, size: 1200 }),
  repo(2, "beta", { stargazers_count: 900, license: { spdx_id: "GPL-3.0" }, pushed_at: iso(200), homepage: null, language: "Python", size: 5000 }),
  repo(3, "gamma", { stargazers_count: 400, license: null, pushed_at: iso(40), topics: ["starter", "pdf"], size: 300 }),
  repo(4, "delta", { stargazers_count: 40, license: { spdx_id: "MIT" }, pushed_at: iso(800), archived: true, homepage: null, size: 90000 }),
];
const byName = Object.fromEntries(REPOS.map((r) => [r.full_name, r]));

const seen = { withAuth: 0, withoutAuth: 0 };
const rateHeaders = { "x-ratelimit-remaining": "4999", "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600) };

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...rateHeaders, ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const weeks = Array.from({ length: 52 }, (_, i) => ({ total: i < 39 ? 2 : 6 }));
const pulls = [1, 2, 3, 4, 5].map((d) => ({ created_at: iso(30), merged_at: iso(30 - d) }));

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  const auth = req.headers.authorization ?? "";
  if (url.pathname === "/__seen") return send(res, 200, seen);

  // The sign-in pages of GitHub itself (github.com/login/oauth/...). They carry no token, so they are not counted.
  if (url.pathname === "/login/oauth/authorize") {
    const back = `${url.searchParams.get("redirect_uri")}?code=fakecode1234567890&state=${encodeURIComponent(url.searchParams.get("state") ?? "")}`;
    res.writeHead(302, { location: back });
    return res.end();
  }
  if (url.pathname === "/login/oauth/access_token") return send(res, 200, { access_token: `gho_${"f".repeat(36)}`, token_type: "bearer", scope: "" });

  if (auth) seen.withAuth += 1;
  else seen.withoutAuth += 1;

  if (url.pathname === "/rate_limit") {
    if (auth.includes("BAD")) return send(res, 401, { message: "Bad credentials" });
    return send(res, 200, { resources: {} }, auth.includes("ghp_") ? { "x-oauth-scopes": "repo" } : {});
  }
  if (url.pathname === "/search/repositories") return send(res, 200, { items: REPOS });
  if (url.pathname === "/search/issues") return send(res, 200, { total_count: 5 });

  const m = /^\/repos\/([^/]+\/[^/]+)(\/.*)?$/.exec(url.pathname);
  const found = m ? byName[m[1]] : undefined;
  if (!m || !found) return send(res, 404, { message: "Not Found" });
  switch (m[2]) {
    case undefined: return send(res, 200, found);
    case "/releases/latest":
      return found.full_name === "acme/alpha" ? send(res, 200, { published_at: iso(20) }) : send(res, 404, { message: "Not Found" });
    case "/pulls": return send(res, 200, pulls);
    case "/contributors":
      return send(res, 200, [{}], { link: `<http://127.0.0.1/x?per_page=1&page=42>; rel="last"` });
    case "/stats/commit_activity": return send(res, 200, weeks);
    case "/contents/package.json":
      return send(res, 200, { encoding: "base64", content: Buffer.from(JSON.stringify({ dependencies: { a: "1", b: "1", c: "1" } })).toString("base64") });
    default: return send(res, 404, { message: "Not Found" });
  }
});

server.listen(PORT, "127.0.0.1", () => process.stdout.write(`fake GitHub on ${PORT}\n`));
