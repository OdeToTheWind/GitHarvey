import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { OAuthConfig } from "./env";

// "Sign in with GitHub" (OAuth web flow). No scope is requested, so GitHub issues a token that can
// only read public information. The client secret and the one-time code go to github.com and nowhere else.
const PUBLIC_OAUTH = "https://github.com";
const CODE_PATTERN = /^[\w-]{10,100}$/;

/** Browser tests can point sign-in at a fake GitHub on this machine. Ignored in production and for any other address. */
function oauthBase(): string {
  const override = process.env.GITHARVEY_GITHUB_OAUTH;
  if (!override || process.env.NODE_ENV === "production") return PUBLIC_OAUTH;
  try {
    const url = new URL(override);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" ? url.origin : PUBLIC_OAUTH;
  } catch {
    return PUBLIC_OAUTH;
  }
}

export function newState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(bytes).toString("base64url");
}

/** Constant-time comparison, so the check leaks nothing about the stored value. */
export function sameState(received: string | null, stored: string | null): boolean {
  if (!received || !stored) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isPlausibleCode(code: string | null): code is string {
  return code !== null && CODE_PATTERN.test(code);
}

export function authorizeUrl(config: OAuthConfig, redirectUri: string, state: string): string {
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: redirectUri, state });
  return `${oauthBase()}/login/oauth/authorize?${params.toString()}`;
}

/** Trades the one-time code for an access token. Any failure is null; details are never exposed or logged. */
export async function exchangeCode(config: OAuthConfig, code: string, redirectUri: string): Promise<string | null> {
  try {
    const res = await fetch(`${oauthBase()}/login/oauth/access_token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: redirectUri }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { access_token?: unknown };
    return typeof body.access_token === "string" && body.access_token.length >= 20 ? body.access_token : null;
  } catch {
    return null;
  }
}
