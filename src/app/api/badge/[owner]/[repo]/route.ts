import { NextResponse } from "next/server";
import { renderBadge, type BadgeColor } from "@/lib/badge";
import { getFallbackToken } from "@/lib/env";
import { allow, clientIp } from "@/lib/ratelimit";
import { isValidRepoName } from "@/lib/repoName";
import { loadScoredRepo } from "@/lib/search";

// Badges are public images, so they use the host's fallback token only (never a visitor's
// cookie). Never log the token or the request in this file.
const LABEL = "GitHarvey";
const HEADERS = { "Content-Type": "image/svg+xml; charset=utf-8" };

function svg(value: string, color: BadgeColor, cache: string, status = 200) {
  return new NextResponse(renderBadge(LABEL, value, color), { status, headers: { ...HEADERS, "Cache-Control": cache } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> },
) {
  const { owner, repo } = await params;
  const name = `${owner}/${repo}`;
  if (!isValidRepoName(name)) return svg("invalid repo", "gray", "public, max-age=3600", 400);
  if (!allow(`badge:${clientIp(request)}`, 120, 60_000)) return svg("busy", "gray", "no-store", 429);

  const token = getFallbackToken();
  if (!token) return svg("unavailable", "gray", "public, max-age=300");
  try {
    const item = await loadScoredRepo(name, token);
    const word = item.repo.archived ? "Archived" : item.badge === "green" ? "Healthy" : item.badge === "yellow" ? "Okay" : "Risky";
    return svg(`${word} ${item.score}`, item.badge, "public, max-age=3600, s-maxage=3600");
  } catch {
    return svg("not found", "gray", "public, max-age=300");
  }
}
