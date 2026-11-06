import type { CardItem } from "@/components/landing/Cards";

// The in-app version of docs/disclaimer.md. Keep the two in step.
export const DISCLAIMER_SECTIONS: CardItem[] = [
  {
    icon: "security",
    title: "Not affiliated with GitHub",
    text: "GitHarvey is an independent project. It is not affiliated with, endorsed by or sponsored by GitHub, Inc. GitHub is a trademark of GitHub, Inc.",
  },
  {
    icon: "search",
    title: "When it asks GitHub",
    text: "GitHarvey calls the official GitHub API (api.github.com) only after you act: you sign in, run a search, open a comparison or a details page, or press Expand. Expand and details make several small lookups for one repo (release, pull requests, contributors, commit activity, good first issues). Signing in takes you to github.com to approve read-only access. The home, start, privacy and disclaimer pages make no request to GitHub.",
  },
  {
    icon: "token",
    title: "Whose access is used",
    text: "Requests come from the server, using the read-only access GitHub gives you when you sign in (no permissions are requested), kept as a token in an encrypted cookie. They count against your own GitHub rate limit. When it runs out, GitHarvey shows the reset time and stops.",
  },
  {
    icon: "docs",
    title: "What it keeps",
    text: "Public repository data is cached in server memory for up to 10 minutes to save requests. It is not stored in a database. Tokens are never cached or logged.",
  },
  {
    icon: "score",
    title: "Scores are estimates",
    text: "Scores and labels are automated, built from public signals such as recent activity, license, docs, popularity and releases. They are a starting point, not an audit, a security review, an endorsement or a promise that a repo is safe, maintained or right for you. GitHub data can be incomplete or out of date. License labels such as \"Permissive\" are information, not legal advice. Read the code and the license before you depend on a repo.",
  },
  {
    icon: "compare",
    title: "GitHub's terms apply",
    text: "Use of the GitHub API is subject to GitHub's Terms of Service and rate limits. Use GitHarvey only with your own GitHub sign-in, and do not use GitHarvey to collect data in bulk. GitHub may change or restrict its API at any time, which can break or limit features.",
  },
  {
    icon: "selfhost",
    title: "The code is public",
    text: "GitHarvey is open source under the MIT license, and its repository is public, so you can read exactly what it sends to GitHub and host your own copy.",
  },
  {
    icon: "archived",
    title: "No warranty",
    text: "GitHarvey is provided as is, without warranty of any kind (see the LICENSE file). You are responsible for your GitHub account: sign out when you are done, and revoke GitHarvey under GitHub, Settings, Applications if in doubt.",
  },
];
