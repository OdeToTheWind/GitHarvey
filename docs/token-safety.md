# Token safety

## How you sign in

GitHarvey has no token box. You press **Sign in with GitHub**, GitHub asks you to approve read-only access to public information, and GitHub sends you back. You never copy a secret around.

- GitHarvey asks GitHub for **no scope**, so the access it receives can read only public data (repositories, profiles), never your private repositories, and cannot change anything.
- If a token that carries any permission ever arrives, GitHarvey refuses it (it checks the `x-oauth-scopes` header from GitHub).
- Signing in is required for Get Started, Compare, results and repo details. The home, privacy and disclaimer pages work without it.

## Where it lives

- The access token is stored only in an encrypted cookie (`iron-session`): `httpOnly`, `Secure` in production, `SameSite=Lax`.
- It lasts 12 hours. The expiry is sealed inside the cookie and enforced by the server, so a copied cookie stops working after that time. A test checks the cookie lifetime.
- The server sends it only to `https://api.github.com`, in the Authorization header.
- It is never logged, never put in a URL, a response body, an error message or a cache key. A test fails if `console.*` appears in `src/lib` or `src/app/api`.
- Browser scripts cannot read it, and the browser never talks to GitHub directly.

## How the sign-in flow is protected

- The flow starts at `/api/auth/github` and returns to `/api/auth/github/callback`.
- A random `state` is sealed in a short-lived (10 minute) encrypted `httpOnly` cookie and compared in constant time. It is used once, so a callback link cannot be replayed.
- The one-time code is traded for a token on the server. The client secret and the code go only to `github.com`, never to the browser.
- The token is then checked, sealed in the cookie below, and lasts 12 hours.
- "Sign out" deletes the cookie. To end the approval itself, revoke GitHarvey under GitHub, Settings, Applications.

## Other protections

- Signing out checks the `Origin` header. Sign-in attempts are rate limited per address (best effort on serverless).
- Only public GitHub data is cached, keyed by request path.
- After you sign in you are sent back to the page you came from. Only GitHarvey's own result pages are allowed as a destination, so a crafted link cannot send you elsewhere.
- Compare and share links hold repo names and your answers only, never the token.
- A strict Content Security Policy and other security headers are set in `next.config.ts`.
- No third-party scripts, analytics or ads.

## Your answers and saved repos

Audience, goal and topic, and the repos you save, are kept in your browser's localStorage so "Your page" and "Saved" can remember them. None of these are secret and none ever include the token.

## Remove or revoke

- In the app: press "Sign out" in the navbar. This deletes the cookie.
- On GitHub: to end the approval itself, revoke GitHarvey under Settings, Applications, Authorized OAuth Apps.

## Self-hosting

On your own deployment the access token reaches only your server and GitHub. You also hold your OAuth app's client secret: keep it in environment variables only. See `self-hosting.md`.
