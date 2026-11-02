import { z } from "zod";

const envSchema = z.object({
  SESSION_SECRET: z.string().min(32),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables when called (not at import time), so
 * `next build` succeeds without secrets. The error names the invalid keys
 * only and never prints their values.
 */
export function getEnv(): Env {
  const parsed = envSchema.safeParse({
    SESSION_SECRET: process.env.SESSION_SECRET || undefined,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  });
  if (!parsed.success) {
    const keys = Array.from(new Set(parsed.error.issues.map((issue) => String(issue.path[0]))));
    throw new Error(`Invalid environment configuration for: ${keys.join(", ")}`);
  }
  return parsed.data;
}
