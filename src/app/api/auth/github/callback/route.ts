import { NextResponse } from "next/server";
import { getOAuthConfig } from "@/lib/env";
import { validateToken } from "@/lib/github";
import { exchangeCode, isPlausibleCode, sameState } from "@/lib/oauth";
import { takeOAuthState } from "@/lib/oauth-state";
import { allow, clientIp } from "@/lib/ratelimit";
import { setToken } from "@/lib/session";

// Finishes "Sign in with GitHub". Never log the code, the state or the token in this file.
// Failures go back to the start page with a short reason code (never a value), so the page can say
// which step failed: oauth-off, oauth-denied, oauth-state, oauth-exchange (plus GitHub's reason), oauth-scope, oauth-github.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin), 302);
  const failed = (reason: string) => go(`/search-repo?error=${reason}`);

  const config = getOAuthConfig();
  if (!config) return failed("oauth-off");
  if (!allow(`oauth:${clientIp(request)}`, 20, 60_000)) return failed("oauth");

  let stored;
  try {
    stored = await takeOAuthState();
  } catch {
    return failed("oauth-state");
  }
  // GitHub sends ?error=access_denied when the visitor presses Cancel.
  if (url.searchParams.has("error")) return failed("oauth-denied");

  const code = url.searchParams.get("code");
  if (!sameState(url.searchParams.get("state"), stored.state) || !isPlausibleCode(code)) return failed("oauth-state");

  const exchange = await exchangeCode(config, code, `${url.origin}/api/auth/github/callback`);
  if (!exchange.ok) return failed(`oauth-exchange&why=${exchange.reason}`);
  const token = exchange.token;

  try {
    const check = await validateToken(token);
    if (!check.valid) return failed("oauth-github");
    // Nothing broader than public read-only access is accepted.
    if (check.scopes.length > 0) return failed("oauth-scope");
    await setToken(token, false);
  } catch {
    return failed("oauth-github");
  }
  return go(stored.next ?? "/search-repo");
}
