import { getOAuthConfig } from "@/lib/env";
import { Cat } from "./Cat";
import { SignInLink } from "./SignInLink";

/**
 * Shown wherever GitHub data is needed and the visitor has not signed in. `reason` says what they
 * will get; `next` is where to land afterwards (one of our own result pages).
 */
export function SignInCard({ reason, next }: { reason: string; next?: string | null }) {
  const configured = getOAuthConfig() !== null;
  return (
    <div className="glow-card mt-8 max-w-xl p-8">
      <Cat name="token" size={88} />
      <p className="text-lg font-bold">Sign in with GitHub to continue</p>
      <p className="mt-2 text-muted">{reason}</p>
      {configured ? (
        <>
          <div className="mt-6"><SignInLink next={next} /></div>
          <p className="mt-4 text-sm text-muted">
            GitHub asks you to approve read-only access to public information. No permissions are requested, and GitHarvey never sees your password.
          </p>
        </>
      ) : process.env.NODE_ENV === "production" ? (
        <p role="alert" className="mt-4 text-clay">Sign-in is not set up on this site yet.</p>
      ) : (
        <p role="alert" className="mt-4 text-sm text-muted">
          Sign-in is not set up yet (this note shows only while developing). Put your GitHub OAuth app&apos;s <strong>GITHUB_CLIENT_ID</strong> and{" "}
          <strong>GITHUB_CLIENT_SECRET</strong> in <code>.env.local</code>, then restart <code>npm run dev</code>. On Vercel add them under Project, Settings,
          Environment Variables. Steps: docs/self-hosting.md.
        </p>
      )}
    </div>
  );
}
