import { json } from "@/lib/api";
import { isSameOrigin } from "@/lib/origin";
import { clearSession, readToken } from "@/lib/session";

// Sign-in happens in /api/auth/github. This route only reports whether you are signed in, and signs you out.

export async function GET() {
  return json({ hasToken: (await readToken()).token !== null });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed." }, 403);
  await clearSession();
  return json({ ok: true });
}
