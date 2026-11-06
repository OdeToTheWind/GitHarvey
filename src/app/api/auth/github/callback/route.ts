import { NextResponse } from "next/server";
import { getOAuthConfig } from "@/lib/env";
import { validateToken } from "@/lib/github";
import { exchangeCode, isPlausibleCode, sameState } from "@/lib/oauth";
import { takeOAuthState } from "@/lib/oauth-state";
import { allow, clientIp } from "@/lib/ratelimit";
import { setToken } from "@/lib/session";

// Finishes "Sign in with GitHub". Never log the code, the state or the token in this file.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const go = (path: string) => NextResponse.redirect(new URL(path, url.origin), 302);
  const failed = () => go("/start?error=oauth");

  const config = getOAuthConfig();
  if (!config) return go("/start?error=oauth-off");
  if (!allow(`oauth:${clientIp(request)}`, 20, 60_000)) return failed();

  const code = url.searchParams.get("code");
  let stored;
  try {
    stored = await takeOAuthState();
  } catch {
    return failed();
  }
  if (!sameState(url.searchParams.get("state"), stored.state) || !isPlausibleCode(code)) return failed();

  const token = await exchangeCode(config, code, `${url.origin}/api/auth/github/callback`);
  if (!token) return failed();

  try {
    const check = await validateToken(token);
    // Same rule as a pasted token: nothing broader than public read-only access.
    if (!check.valid || check.scopes.length > 0) return failed();
    await setToken(token, false);
  } catch {
    return failed();
  }
  return go(stored.next ?? "/start");
}
