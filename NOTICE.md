# Third-party notices

GitHarvey's own code is licensed under the MIT License (see `LICENSE`). The files below are not covered by that license.

## Fonts (`fonts/`)

### CamingoCode

- Author: Jan Fromm, copyright 2006-2014.
- License: Creative Commons Attribution-NoDerivs 3.0 (CC BY-ND 3.0), https://creativecommons.org/licenses/by-nd/3.0/
- Free for personal and commercial use. You may copy and transmit it, but you may not alter, transform, or build upon it. GitHarvey serves the font files unmodified and credits the author in the site footer.
- Original terms: `fonts/camingocode/readme.txt`.

### Catgirl System Font

- No license text or author information is included with the font files.
- Before you publish or redistribute GitHarvey, confirm the font's license with its source and add the terms here. If the terms do not allow redistribution, remove `fonts/catgirl-system-font/` and the places that load it (`src/app/layout.tsx`, `src/app/opengraph-image.tsx`).

## Dependencies

GitHarvey depends on open-source packages, each under its own license. All direct dependencies use the MIT License, except three development tools that are never part of the built site: TypeScript and Playwright (Apache License 2.0) and axe-core (Mozilla Public License 2.0). Run `npm ls` to see the full tree, and check each package's license before you redistribute a bundled build.

| Package | License |
|---|---|
| next, react, react-dom | MIT |
| iron-session, server-only, zod | MIT |
| tailwindcss, @tailwindcss/turbopack | MIT |
| eslint, eslint-config-next, vitest | MIT |
| typescript | Apache-2.0 |
| @playwright/test (browser tests) | Apache-2.0 |
| axe-core (accessibility checks in browser tests) | MPL-2.0 |
| @types/node, @types/react, @types/react-dom | MIT |

## GitHub

GitHarvey is not affiliated with or endorsed by GitHub. Repository data comes from the public GitHub REST API and is subject to GitHub's terms of service. "GitHub" is a trademark of GitHub, Inc. See [docs/disclaimer.md](docs/disclaimer.md).
