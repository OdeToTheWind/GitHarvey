import { z } from "zod";

const envSchema = z.object({
  SESSION_SECRET: z.string().min(32),
  ENABLE_FALLBACK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FALLBACK_GITHUB_TOKEN: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * The host's fallback token, if the host turned the fallback on. Reads only the
 * fallback settings, so it works even when SESSION_SECRET is not set.
 */
export function getFallbackToken(): string | null {
  const token = process.env.FALLBACK_GITHUB_TOKEN;
  return process.env.ENABLE_FALLBACK === "true" && token ? token : null;
}

/**
 * Validates environment variables when called (not at import time), so
 * `next build` succeeds without secrets. The error names the invalid keys
 * only and never prints their values.
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse({
    SESSION_SECRET: process.env.SESSION_SECRET || undefined,
    ENABLE_FALLBACK: process.env.ENABLE_FALLBACK || undefined,
    FALLBACK_GITHUB_TOKEN: process.env.FALLBACK_GITHUB_TOKEN || undefined,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
  if (!parsed.success) {
    const keys = Array.from(new Set(parsed.error.issues.map((issue) => String(issue.path[0]))));
    throw new Error(`Invalid environment configuration for: ${keys.join(", ")}`);
  }
  return parsed.data;
}
