export const TAGLINE = "Great repos are everywhere. Find yours.";

export const ABOUT =
  "GitHarvey helps you find the right GitHub repo for your goal. Tell it who you are and what you need, and get repos scored for health, with the reasons shown, and compared side by side. Free, open source, no database. Sign in with GitHub for read-only access to public data, or self-host on Vercel.";

/**
 * The public GitHub repo, set with REPO_URL (for example
 * https://github.com/yourname/githarvey). Anything that is not a github.com
 * https URL is ignored, so the footer never links somewhere unexpected.
 */
export function parseRepoUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const ok = url.protocol === "https:" && url.hostname === "github.com" && /^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname);
    return ok ? `https://github.com${url.pathname.replace(/\/$/, "")}` : null;
  } catch {
    return null;
  }
}

/** The site's own address, from SITE_URL (localhost when unset). No trailing slash. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Pages worth indexing. Results, compare, details, saved and your page stay out: they need you to be signed in. */
export const PUBLIC_PATHS = ["/", "/start", "/privacy", "/disclaimer"] as const;

/** Pages that need a signed-in visitor. Crawlers are asked to skip them. */
export const PRIVATE_PATHS = ["/api/", "/finder", "/compare", "/my", "/repo/", "/saved"] as const;

export function repoUrl(): string | null {
  return parseRepoUrl(process.env.REPO_URL);
}
