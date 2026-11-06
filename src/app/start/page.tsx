import type { Metadata } from "next";
import Link from "next/link";
import { Cat } from "@/components/Cat";
import { Onboarding } from "@/components/Onboarding";
import { SetupNotice } from "@/components/SetupNotice";
import { SignInCard } from "@/components/SignInCard";
import { safeNext } from "@/lib/redirect";
import { readToken } from "@/lib/session";

export const metadata: Metadata = { title: "Get started" };

const ERRORS: Record<string, string> = {
  oauth: "Sign in with GitHub did not finish. Please try again.",
  "oauth-off": "Sign in with GitHub is not set up on this site yet.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StartPage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = params.next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);
  const errorKey = String(params.error);
  const error = Object.hasOwn(ERRORS, errorKey) ? ERRORS[errorKey] : undefined;
  const state = await readToken();
  const signedIn = state.configured && state.token !== null;

  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
      <h1 className="text-4xl">Get started</h1>
      {error && <p role="alert" className="mt-6 text-clay">{error}</p>}
      {!state.configured && <SetupNotice />}
      {state.configured && !signedIn && (
        <SignInCard reason="GitHarvey reads public repo data from GitHub on your behalf, so you sign in first. Then you answer four short questions." next={next} />
      )}
      {signedIn && (
        <section aria-labelledby="prefs-h" className="mt-12 max-w-3xl">
          <Cat name="questions" size={88} />
          <h2 id="prefs-h" className="text-2xl">Tell us what you need</h2>
          <p className="mt-2 text-muted">You are signed in with GitHub. Four short questions, then your ranked repos.</p>
          {next && <Link href={next} className="btn-primary mt-4">Continue to your results</Link>}
          <div className="mt-6"><Onboarding /></div>
        </section>
      )}
    </main>
  );
}
