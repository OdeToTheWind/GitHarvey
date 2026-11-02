<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/banner-dark.png">
    <img src="docs/images/banner-light.png" alt="GitHarvey: Great repos are everywhere. Find yours." width="100%">
  </picture>
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-0a5cff"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000">
  <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-0a5cff">
  <img alt="No database" src="https://img.shields.io/badge/database-none-000000">
  <img alt="Free" src="https://img.shields.io/badge/price-free-0a5cff">
</p>

GitHarvey helps you find the right GitHub repo for your goal. Tell it who you are and what you need, and get repos scored for health, with the reasons shown, and compared side by side. Free, open source, no database. Bring your own read-only token, or self-host on Vercel.

GitHub search ranks by stars and stops there. GitHarvey scores how healthy each repo is, shows how every point was earned, and lets you compare repos before you depend on one.

## How it works

1. **Add a read-only token.** A fine-grained GitHub token with public-repository read access. It is kept in an encrypted cookie.
2. **Answer four questions.** Who you are, your goal, a topic (and optionally a language), and what matters most.
3. **Get ranked repos.** One GitHub search fetches the 30 best matches. GitHarvey scores them all and shows the healthiest first, 10 at a time.
4. **Look closer.** Open "Why this score", press Expand for release info, or tick two or three repos and compare them side by side.

## Features

- **Health score, 0 to 100,** with a Healthy / Okay / Risky badge. The word and number always appear, so colour is never the only signal.
- **"Why this score"** on every result: each signal, what was found, and the points it added.
- **Answers that change the search.** Audience sets the scoring weights. Goal and priorities change the query: recently updated, popular, beginner friendly (good first issues), permissive license.
- **Side-by-side comparison** of two or three repos, with the best value in each row marked and a data-only summary line.
- **Shareable links** for comparisons and for your results page. They hold repo names and your answers, never your token.
- **Your page** remembers your answers in your browser.
- **README badge** for any repo: `![GitHarvey](https://your-site/api/badge/owner/repo)` (needs the host's fallback token).
- **Return after sign-in.** After you add a token you land back on the results you asked for.

## Quick start

You need Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
openssl rand -base64 32      # paste the output after SESSION_SECRET= in .env.local
npm run dev
```

Open http://localhost:3000, add a token on the start page, and search.

### Create a safe token

On GitHub open Settings, Developer settings, Personal access tokens, Fine-grained tokens, then Generate new token. Set the expiration to 30 days, choose **Public repositories (read-only)**, and add **no permissions**. GitHarvey rejects classic tokens that carry scopes.

## Configuration

Set these in `.env.local` (or in your Vercel project). See [docs/self-hosting.md](docs/self-hosting.md).

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | yes | 32 or more characters. Encrypts the token cookie |
| `ENABLE_FALLBACK` | no | `true` lets visitors search without their own token, using yours. Default `false` |
| `FALLBACK_GITHUB_TOKEN` | no | A fine-grained, public-read-only token for the fallback and for badges |
| `NEXT_PUBLIC_SITE_URL` | no | Your site address, for the social preview image |
| `NEXT_PUBLIC_REPO_URL` | no | Your repo address, for the footer links |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, strict mode |
| `npm test` | Vitest |

Run `npm run lint && npm run typecheck && npm test && npm run build` before you commit.

## Project structure

```
src/app          pages and API routes (session, release, badge), social preview image
src/components   UI; landing/ holds the home page sections
src/lib          logic: scoring, query building, GitHub client, session, cache
src/__tests__    unit and component tests
fonts/           CamingoCode (text) and Catgirl System Font (pictures)
docs/            how scoring works, token safety, self-hosting
```

Files in `src/lib` that touch the token or GitHub start with `import "server-only"`, so they can never be bundled for the browser.

## Security

- The token is stored only in an encrypted `httpOnly` cookie (`Secure` in production, `SameSite=Lax`). It lasts 12 hours, or 7 days with "Remember me".
- The server sends it only to `https://api.github.com`. The browser never talks to GitHub.
- It is never logged, cached, or placed in a URL, response, or error message. A test fails if `console.*` appears in `src/lib` or `src/app/api`.
- Saving or removing a token checks the `Origin` header, validates input with zod, and is rate limited.
- Only public GitHub data is cached, keyed by request path.
- No database, analytics, ads, or third-party scripts.

Details: [docs/token-safety.md](docs/token-safety.md).

## Deploy your own

Fork the repo and import it into Vercel, set `SESSION_SECRET`, and deploy. Step by step, with a checklist: [docs/self-hosting.md](docs/self-hosting.md).

## How scoring works

Five signals (recent activity, license, docs, popularity, a release bonus), weighted by audience. Archived repos are capped at 20. Full rules and limits: [docs/how-scoring-works.md](docs/how-scoring-works.md).

## Tech stack

Next.js (App Router), React, TypeScript (strict), Tailwind CSS, iron-session, zod, and Vitest. No other runtime dependencies.

## Disclaimer

GitHarvey is not affiliated with GitHub, Inc. It calls the official GitHub API only after you act (save a token, search, compare, or press Expand), using your read-only token or, if the site owner enabled it, theirs. Scores are automated estimates from public data, not an audit or an endorsement, so read a repo's code and license before you depend on it. The repository is public and open source, so you can see exactly what is sent to GitHub. Full text: [docs/disclaimer.md](docs/disclaimer.md).

## Contributing

Issues and pull requests are welcome. Keep changes small and targeted, keep components short with logic in `src/lib`, add tests for new logic, and do not add dependencies without discussing them first. Never add logging that could include the token.

## License

Code: [MIT](LICENSE). Fonts and dependencies have their own terms: see [NOTICE.md](NOTICE.md).
