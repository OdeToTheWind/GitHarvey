import { isValidRepoName } from "./repoName";

const ALLOWED = new Set(["/finder", "/compare", "/my"]);
const REPO_PAGE = /^\/repo\/([^/]+\/[^/]+)$/;

function isAllowedPath(pathname: string): boolean {
  if (ALLOWED.has(pathname)) return true;
  const repo = REPO_PAGE.exec(pathname)?.[1];
  return repo !== undefined && isValidRepoName(repo);
}

/**
 * Where to send a visitor after they save a token. Only our own result pages
 * (finder, compare, your page and repo details) are allowed, so a crafted link can never redirect off-site.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 500 || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f]/.test(value)) return null;
  try {
    const url = new URL(value, "http://githarvey.invalid");
    if (url.origin !== "http://githarvey.invalid" || !isAllowedPath(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
