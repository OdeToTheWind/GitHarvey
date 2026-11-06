# Security policy

GitHarvey handles a GitHub token for every visitor, so security reports are taken seriously.

## Reporting a problem

Please **do not open a public issue** for a security problem. Report it privately:

1. Open the [private vulnerability report form](https://github.com/OdeToTheWind/GitHarvey/security/advisories/new).
2. Describe what you found, how to reproduce it, and what an attacker could do.
3. Do not include a real token in the report.

This is a free, volunteer-run project, so replies are best effort. You will get an acknowledgement as soon as the maintainer can send one, and credit in the fix if you want it.

## What counts

Anything that could expose or misuse a visitor's token, for example:

- the token appearing in a URL, log, response, error message, cache or browser storage
- a way to send the token anywhere other than `api.github.com`
- a way around the checks on signing out (origin check) or on the sign-in routes (rate limit)
- the sign-in redirect (`/api/auth/github`) accepting a forged state or sending visitors off-site
- the OAuth client secret appearing anywhere outside the server's environment
- cross-site scripting, or weakening of the security headers

## Supported versions

Only the latest commit on `main` is supported. If you self-host, redeploy after each fix.

## How the token is protected

See [docs/token-safety.md](docs/token-safety.md).
