import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { describeError } from "./errors";
import { allow, clientIp } from "./ratelimit";
import { isValidRepoName } from "./repoName";
import { readToken } from "./session";

const nameSchema = z.string().refine(isValidRepoName);

export function json(body: unknown, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

/** Shared GET handler for public-data lookups on one repo. Never logs or echoes the token. */
export async function repoLookup<T>(
  request: Request,
  run: (name: string, token: string) => Promise<T>,
): Promise<NextResponse> {
  if (!allow(`lookup:${clientIp(request)}`, 60, 60_000)) {
    return json({ error: "Too many requests. Wait a minute and try again." }, 429, { "Retry-After": "60" });
  }
  const parsed = nameSchema.safeParse(new URL(request.url).searchParams.get("name"));
  if (!parsed.success) return json({ error: "Enter a repo as owner/repo." }, 400);

  const state = await readToken();
  if (!state.configured) return json({ error: "Server is not configured." }, 500);
  const token = state.token;
  if (!token) return json({ error: "Add a read-only GitHub token first." }, 401);

  try {
    return json(await run(parsed.data, token));
  } catch (error) {
    const info = describeError(error);
    return json({ error: info.message, resetAt: info.resetAt }, info.badToken ? 401 : info.resetAt ? 429 : 502);
  }
}
