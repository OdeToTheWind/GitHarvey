import { z } from "zod";
import { json } from "@/lib/api";
import { validateToken } from "@/lib/github";
import { isSameOrigin } from "@/lib/origin";
import { allow, clientIp } from "@/lib/ratelimit";
import { clearSession, readToken, setToken } from "@/lib/session";

// Never log the request body or the token in this file.

const bodySchema = z.object({
  token: z.string().min(20).max(255).regex(/^\S+$/),
  remember: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed." }, 403);
  if (!allow(`session:${clientIp(request)}`, 10, 60_000)) {
    return json({ error: "Too many attempts. Wait a minute and try again." }, 429, { "Retry-After": "60" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Enter a valid token." }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter a valid token." }, 400);
  const { token, remember } = parsed.data;

  let check;
  try {
    check = await validateToken(token);
  } catch {
    return json({ error: "Could not reach GitHub. Try again in a moment." }, 502);
  }
  if (!check.valid) return json({ error: "GitHub rejected this token. Check it and try again." }, 401);
  if (check.scopes.length > 0) {
    return json(
      {
        error:
          "This looks like a classic token with permissions. Create a fine-grained token with public repositories read-only access.",
      },
      400,
    );
  }

  try {
    await setToken(token, remember);
  } catch {
    return json({ error: "Server is not configured." }, 500);
  }
  return json({ ok: true, rate: check.rate });
}

export async function GET() {
  return json({ hasToken: (await readToken()).token !== null });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed." }, 403);
  await clearSession();
  return json({ ok: true });
}
