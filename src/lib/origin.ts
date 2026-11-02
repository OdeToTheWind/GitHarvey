import "server-only";

/**
 * CSRF guard for state-changing routes. The Origin header must be present
 * and match the host the request was sent to.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host = request.headers.get("host") ?? new URL(request.url).host;
  return originHost === host;
}
