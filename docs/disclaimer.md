# Disclaimer

How GitHarvey uses the GitHub API, and what its results do and do not mean. The same text is shown in the app at `/disclaimer`.

## Not affiliated with GitHub

GitHarvey is an independent project. It is not affiliated with, endorsed by or sponsored by GitHub, Inc. "GitHub" is a trademark of GitHub, Inc.

## When it asks GitHub

GitHarvey calls the official GitHub REST API (`api.github.com`) only after you act:

- you sign in with GitHub (GitHub's own sign-in pages, then one call to `/rate_limit`, which does not use quota),
- you run a search (one search call),
- you open a comparison or a details page (lookups for the repos you chose),
- you press Expand on a result (a few small lookups for that one repo: release, recent pull requests, contributors, commit activity, good first issues and, for JavaScript, TypeScript and Python repos, one dependency file).

Signing in takes you to `github.com` to approve read-only access to public information, and nothing else.

The home, start, privacy and disclaimer pages make no request to GitHub.

## Whose token is used

Requests are made by the server, not your browser. They use the read-only access GitHub gives you when you sign in (no permissions are requested), kept as a token in an encrypted `httpOnly` cookie. They count against your own GitHub rate limit. When the limit is reached, GitHarvey shows the reset time and stops. The token is sent only to `api.github.com` and is never logged. See [token-safety.md](token-safety.md).

## What it keeps

Public repository data is cached in server memory for up to 10 minutes to save requests. It is not stored in a database. Tokens are never cached. Your answers (audience, goal, topic) stay in your own browser.

## Scores are estimates

Scores and labels are automated. They come from public signals: recent activity, license, docs, popularity and releases (see [how-scoring-works.md](how-scoring-works.md)). They are a starting point. They are not an audit, a security review, an endorsement, or a promise that a repo is safe, maintained or right for you. Data from GitHub can be incomplete or out of date, and a license shown here may be wrong. License labels such as "Permissive" are information, not legal advice. Read the code and the license before you depend on a repo.

## GitHub's terms apply

Use of the GitHub API is subject to [GitHub's Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) and its API rate limits. Use GitHarvey only with your own GitHub sign-in, and do not use GitHarvey to collect data in bulk. GitHub may change or restrict its API at any time, which can break or limit features.

## The code is public

GitHarvey is open source under the MIT license. Its repository is public, so you can read exactly what it sends to GitHub, and host your own copy ([self-hosting.md](self-hosting.md)).

## No warranty

GitHarvey is provided "as is", without warranty of any kind (see [LICENSE](../LICENSE)). You are responsible for your token: give it the smallest permission and sign out, and revoke GitHarvey under GitHub, Settings, Applications if you are in doubt.
