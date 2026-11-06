import { z } from "zod";
import type { Audience, Preferences, Priority, ScoringPrefs } from "@/types";

export const AUDIENCES = ["beginner", "developer", "security", "founder"] as const;
export const GOALS = ["learn", "build", "compare", "stay-updated"] as const;
export const PRIORITIES = [
  "maintained",
  "beginner-friendly",
  "popular",
  "permissive-license",
] as const;
export const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "go",
  "rust",
  "java",
  "csharp",
  "cpp",
] as const;

const prefsSchema = z.object({
  audience: z.enum(AUDIENCES),
  goal: z.enum(GOALS),
  topic: z.string().trim().min(1).max(80),
  language: z.enum(LANGUAGES).optional(),
  priorities: z
    .array(z.enum(PRIORITIES))
    .max(10)
    .transform((list) => Array.from(new Set(list))),
});

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function first(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function encodePrefs(prefs: Preferences): URLSearchParams {
  const params = new URLSearchParams();
  params.set("aud", prefs.audience);
  params.set("goal", prefs.goal);
  params.set("q", prefs.topic);
  if (prefs.language) params.set("lang", prefs.language);
  if (prefs.priorities.length > 0) params.set("pri", prefs.priorities.join(","));
  return params;
}

type DecodeResult =
  | { ok: true; prefs: Preferences }
  | { ok: false };

export function decodePrefs(params: RawParams): DecodeResult {
  try {
    const pri = first(params, "pri");
    const parsed = prefsSchema.safeParse({
      audience: first(params, "aud"),
      goal: first(params, "goal"),
      topic: first(params, "q"),
      language: first(params, "lang") || undefined,
      priorities: pri ? pri.split(",").filter(Boolean) : [],
    });
    if (!parsed.success) return { ok: false };
    return { ok: true, prefs: parsed.data };
  } catch {
    return { ok: false };
  }
}

/** Reads scoring settings (aud, goal, pri) from a URL. Missing or bad values fall back to the developer defaults. */
export function decodeScoring(params: RawParams): ScoringPrefs {
  const audience = z.enum(AUDIENCES).safeParse(first(params, "aud"));
  const goal = z.enum(GOALS).safeParse(first(params, "goal"));
  const pri = (first(params, "pri") ?? "").split(",");
  const priorities = Array.from(new Set(pri.filter((p): p is Priority => (PRIORITIES as readonly string[]).includes(p))));
  return {
    audience: audience.success ? audience.data : "developer",
    ...(goal.success ? { goal: goal.data } : {}),
    priorities,
  };
}

/** Starting priorities for each audience in onboarding. */
export function defaultPriorities(audience: Audience): Priority[] {
  switch (audience) {
    case "beginner":
      return ["beginner-friendly", "maintained"];
    case "developer":
      return ["maintained", "popular"];
    case "security":
      return ["maintained"];
    case "founder":
      return ["permissive-license", "maintained"];
  }
}

/** The sample search behind the "Try an example" button. */
export const EXAMPLE_PREFS: Preferences = {
  audience: "beginner",
  goal: "learn",
  topic: "pdf parsing",
  language: "python",
  priorities: defaultPriorities("beginner"),
};
