# Self-hosting on Vercel

GitHarvey is a Next.js app with no database. The free Vercel Hobby plan is enough.

1. Fork this repository on GitHub.
2. In Vercel choose Add New, Project, and import your fork. Framework preset: Next.js (detected automatically).
3. Add environment variables before the first deploy:

| Name | Required | Notes |
|---|---|---|
| `SESSION_SECRET` | yes | 32+ characters. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | no | Your site URL. Used for the social preview image and absolute links |
| `NEXT_PUBLIC_REPO_URL` | no | Your public repo, such as `https://github.com/you/githarvey`. Adds the GitHub link in the navbar and the "View the source", "Report an issue" and "Host your own" links in the footer. Hidden when unset |

4. Deploy. Your site appears at `https://<project>.vercel.app`.

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
- [ ] Save a real fine-grained token once and run a search, a comparison and "Expand" on a result
- [ ] Update the name in `LICENSE` to your own
- [ ] Open the site on a phone and check the pages
- [ ] Run `npm run lint && npm run typecheck && npm test && npm run build`

## Notes

- Every visitor adds their own read-only token, so the host holds no GitHub token and has no quota to protect.
- Rate limiting and the cache live in server memory, so they are per instance.
