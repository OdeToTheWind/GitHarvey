import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { getEnv } from "./env";

interface StateData {
  state?: string;
  next?: string;
}

const COOKIE_NAME = "rf_oauth";
const TTL_SECONDS = 10 * 60;

async function open() {
  return getIronSession<StateData>(await cookies(), {
    cookieName: COOKIE_NAME,
    password: getEnv().SESSION_SECRET,
    ttl: TTL_SECONDS,
    // Lax, so the cookie comes back when GitHub sends the visitor to our callback.
    cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth" },
  });
}

/** Remembers the random `state` (and where to go afterwards) for the few minutes the sign-in takes. */
export async function saveOAuthState(state: string, next: string | null): Promise<void> {
  const session = await open();
  session.state = state;
  session.next = next ?? undefined;
  await session.save();
}

/** Reads the saved state once and forgets it, so a callback link cannot be replayed. */
export async function takeOAuthState(): Promise<{ state: string | null; next: string | null }> {
  const session = await open();
  const taken = { state: session.state ?? null, next: session.next ?? null };
  session.destroy();
  return taken;
}
