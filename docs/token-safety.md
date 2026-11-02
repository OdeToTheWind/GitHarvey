# Token safety

## Which token to create

Create a **fine-grained personal access token**: GitHub Settings, Developer settings, Personal access tokens, Fine-grained tokens, Generate new token.

- Expiration: 30 days
- Repository access: **Public repositories (read-only)**
- Permissions: **none**

GitHarvey rejects classic tokens that carry scopes (it checks the `x-oauth-scopes` header from GitHub).

## Where it lives

- Your token is stored only in an encrypted cookie (`iron-session`): `httpOnly`, `Secure` in production, `SameSite=Lax`.
- It lasts 12 hours, or 7 days if you tick "Remember me". The expiry is sealed inside the cookie and enforced by the server, so a copied cookie stops working after that time. A test checks the cookie lifetime.
- The server sends it only to `https://api.github.com`, in the Authorization header.
- It is never logged, never put in a URL, a response body, an error message or a cache key. A test fails if `console.*` appears in `src/lib` or `src/app/api`.
- Browser scripts cannot read it, and the browser never talks to GitHub directly.

## Other protections

- Saving or removing a token checks the `Origin` header and validates input with zod.
- Attempts are rate limited per address (best effort on serverless).
- Only public GitHub data is cached, keyed by request path.
- After you save a token you are sent back to the page you came from. Only GitHarvey's own result pages are allowed as a destination, so a crafted link cannot send you elsewhere.
- Compare and share links hold repo names and your answers only, never the token.
- A strict Content Security Policy and other security headers are set in `next.config.ts`.
- No third-party scripts, analytics or ads.

## Your answers

Audience, goal and topic are kept in your browser's localStorage so "Your page" can remember them. They are not secret and never include the token.

## Remove or revoke

- In the app: press "Remove token" in the header or on the start page.
- On GitHub: revoke it under Settings, Developer settings, Personal access tokens.
- If you ever pasted a broader token, revoke it right away.

## Self-hosting

On your own deployment the token reaches only your server and GitHub. See `self-hosting.md`.
