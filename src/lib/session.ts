import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { getEnv } from "./env";

interface SessionData {
  token?: string;
}

const COOKIE_NAME = "rf_session";
const SESSION_TTL_SECONDS = 12 * 60 * 60; // tokens expire after 12h unless "remember"
const REMEMBER_TTL_SECONDS = 7 * 24 * 60 * 60;

function buildSessionOptions(remember: boolean): SessionOptions {
  return {
    cookieName: COOKIE_NAME,
    password: getEnv().SESSION_SECRET,
    ttl: remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // maxAge is left out on purpose: iron-session derives it from `ttl`, so the
      // cookie and the sealed expiry both end after 12 hours (7 days with "remember").
      // Setting maxAge to undefined would make the sealed token never expire.
    },
  };
}

async function getSession(): Promise<IronSession<SessionData>> {
  // Read with the longest ttl so a "remembered" cookie is never rejected;
  // the expiry sealed into the cookie still ends shorter sessions.
  return getIronSession<SessionData>(await cookies(), buildSessionOptions(true));
}

async function getToken(): Promise<string | null> {
  const session = await getSession();
  return session.token ?? null;
}

/** For layouts: a missing or invalid SESSION_SECRET reads as "no token" instead of crashing every page. */
export async function hasToken(): Promise<boolean> {
  try {
    return (await getToken()) !== null;
  } catch {
    return false;
  }
}

/** Like getToken, but reports a missing or invalid SESSION_SECRET instead of throwing. */
export async function readToken(): Promise<{ configured: boolean; token: string | null }> {
  try {
    return { configured: true, token: await getToken() };
  } catch {
    return { configured: false, token: null };
  }
}

export async function setToken(token: string, remember: boolean): Promise<void> {
  const session = await getSession();
  session.updateConfig(buildSessionOptions(remember));
  session.token = token;
  await session.save();
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
