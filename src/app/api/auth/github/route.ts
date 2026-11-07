import { NextResponse } from "next/server";
import { getOAuthConfig } from "@/lib/env";
import { authorizeUrl, newState } from "@/lib/oauth";
import { saveOAuthState } from "@/lib/oauth-state";
import { allow, clientIp } from "@/lib/ratelimit";
import { safeNext } from "@/lib/redirect";

// Starts "Sign in with GitHub". Never log the request or any value from it in this file.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const back = (error: string) => NextResponse.redirect(new URL(`/search-repo?error=${error}`, url.origin), 302);

  const config = getOAuthConfig();
  if (!config) return back("oauth-off");
  if (!allow(`oauth:${clientIp(request)}`, 20, 60_000)) return back("oauth");

  const state = newState();
  try {
    await saveOAuthState(state, safeNext(url.searchParams.get("next")));
  } catch {
    return back("oauth");
  }
  return NextResponse.redirect(authorizeUrl(config, `${url.origin}/api/auth/github/callback`, state), 302);
}
