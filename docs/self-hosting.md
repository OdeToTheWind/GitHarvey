# Self-hosting on Vercel

GitHarvey is a Next.js app with no database. The free Vercel Hobby plan is enough.

1. Fork this repository on GitHub.
2. In Vercel choose Add New, Project, and import your fork. Framework preset: Next.js (detected automatically).
3. Add environment variables before the first deploy:

| Name | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | yes | 32+ characters. Generate with `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | yes | Client ID of your GitHub OAuth app. See [Sign in with GitHub](#sign-in-with-github-required) |
| `GITHUB_CLIENT_SECRET` | yes | The OAuth app's client secret. Server only: never prefix it with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | no | Your site URL. Used for the social preview image and absolute links |
| `NEXT_PUBLIC_REPO_URL` | no | Your public repo, such as `https://github.com/you/githarvey`. Adds the GitHub link in the navbar and the "View the source", "Report an issue" and "Host your own" links in the footer. Hidden when unset |

4. Deploy. Your site appears at `https://<project>.vercel.app`.

## Sign in with GitHub (required)

Visitors sign in with GitHub: there is no token box. Get Started, Compare and the results pages need it, so create the OAuth app before you deploy:

1. On GitHub open Settings, Developer settings, OAuth Apps, New OAuth App.
2. Set **Homepage URL** to your site and **Authorization callback URL** to `https://<your-domain>/api/auth/github/callback`. For local testing make a second app with `http://localhost:3000/api/auth/github/callback`.
3. Copy the **Client ID**, generate a **Client secret**, and put both where the app reads its settings:
   - **Local:** in `.env.local` (copy `.env.example` first), as `GITHUB_CLIENT_ID=...` and `GITHUB_CLIENT_SECRET=...`, then restart `npm run dev`.
   - **Vercel:** Project, Settings, Environment Variables, add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` for Production (and Preview if you use it), then redeploy.
   - Never commit the secret, and never prefix it with `NEXT_PUBLIC_`.

GitHarvey requests no scope, so the token can only read public information. Your site never holds a GitHub token of its own: each visitor's access, and quota, stay theirs. Until both variables are set, visitors see "Sign-in is not set up yet" instead of the button. While you develop, that note also says where to put the variables.

## Search engines

`/robots.txt` and `/sitemap.xml` are generated from `NEXT_PUBLIC_SITE_URL`. Only the public pages (home, start, privacy, disclaimer) are listed. Results, compare, repo details, saved and your page are marked `noindex`.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set SESSION_SECRET
npm run dev
```

## Check before you ship

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

## Deploy checklist

- [ ] `SESSION_SECRET` set in Vercel (32+ characters)
- [ ] `NEXT_PUBLIC_SITE_URL` set to your real URL, so shared links show the preview image
- [ ] `NEXT_PUBLIC_REPO_URL` set, so the navbar and footer link to your repo
- [ ] `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` set in Vercel, and the callback URL `https://<your-domain>/api/auth/github/callback` registered on the OAuth app
- [ ] Sign in with GitHub once, then run a search, a comparison and "Expand" on a result
- [ ] Update the name in `LICENSE` to your own
- [ ] Open the site on a phone and check the pages
- [ ] Run `npm run lint && npm run typecheck && npm test && npm run build`

## Notes

- Every visitor signs in with their own GitHub account, so the host holds no GitHub token and has no quota to protect. You hold only the OAuth app's client secret: keep it in environment variables.
- Rate limiting and the cache live in server memory, so they are per instance.
