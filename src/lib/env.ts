import { z } from "zod";

const envSchema = z.object({
  SESSION_SECRET: z.string().min(32),
  SITE_URL: z.url().optional(),
});

type Env = z.infer<typeof envSchema>;

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * Settings for "Sign in with GitHub", from a GitHub OAuth app. Optional: without both values the
 * button is hidden and visitors paste a token instead. Never needs SESSION_SECRET to read.
 */
export function getOAuthConfig(): OAuthConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/**
 * Validates environment variables when called (not at import time), so
 * `next build` succeeds without secrets. The error names the invalid keys
 * only and never prints their values.
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse({
    SESSION_SECRET: process.env.SESSION_SECRET || undefined,
    SITE_URL: process.env.SITE_URL || undefined,
  });
  if (!parsed.success) {
    const keys = Array.from(new Set(parsed.error.issues.map((issue) => String(issue.path[0]))));
    throw new Error(`Invalid environment configuration for: ${keys.join(", ")}`);
  }
  return parsed.data;
}
