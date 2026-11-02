const ALLOWED = new Set(["/finder", "/compare", "/my"]);

/**
 * Where to send a visitor after they save a token. Only our own result pages
 * are allowed, so a crafted link can never redirect off-site.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 500 || !value.startsWith("/") || value.startsWith("//")) return null;
  if (/[\\\u0000-\u001f]/.test(value)) return null;
  try {
    const url = new URL(value, "http://githarvey.invalid");
    if (url.origin !== "http://githarvey.invalid" || !ALLOWED.has(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
