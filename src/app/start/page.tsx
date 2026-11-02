import type { Metadata } from "next";
import Link from "next/link";
import { Cat } from "@/components/Cat";
import { Onboarding } from "@/components/Onboarding";
import { TokenForm } from "@/components/TokenForm";
import { safeNext } from "@/lib/redirect";
import { hasToken } from "@/lib/session";

export const metadata: Metadata = { title: "Get started" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StartPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);
  const signedIn = await hasToken();
  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-16">
      <h1 className="text-4xl">Get started</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
      <section aria-labelledby="token-h">
        <Cat name="token" size={88} />
        <h2 id="token-h" className="text-2xl">1. Add a read-only token</h2>
        <p className="mb-4 mt-2 text-muted">
          Your token is stored only in an encrypted cookie and sent only to api.github.com.
        </p>
        <TokenForm hasToken={signedIn} next={next} />
        {signedIn && next && <Link href={next} className="btn-primary mt-4">Continue to your results</Link>}
      </section>
      <section aria-labelledby="prefs-h">
        <Cat name="questions" size={88} />
        <h2 id="prefs-h" className="text-2xl">2. Tell us what you need</h2>
        <div className="mt-4"><Onboarding /></div>
      </section>
      </div>
    </main>
  );
}
