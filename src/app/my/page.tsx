import type { Metadata } from "next";
import Link from "next/link";
import { MyActions } from "@/components/MyActions";
import { MyRedirect } from "@/components/MyRedirect";
import { ResultsSection } from "@/components/ResultsSection";
import { ShareLink } from "@/components/ShareLink";
import { decodePrefs } from "@/lib/prefs";
import { Cat } from "@/components/Cat";

export const metadata: Metadata = { title: "Your page" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MyPage({ searchParams }: Props) {
  const decoded = decodePrefs(await searchParams);
  if (!decoded.ok) {
    return (
      <main className="w-full px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
        <MyRedirect />
      </main>
    );
  }
  const { prefs } = decoded;
  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
      <Cat name="ranking" size={88} />
      <h1 className="text-4xl">Your page</h1>
      <p className="mt-3 max-w-xl text-muted">
        You are a {prefs.audience} who wants to {prefs.goal.replace("-", " ")} with “{prefs.topic}”
        {prefs.language ? ` in ${prefs.language}` : ""}.
        {prefs.priorities.length > 0 ? ` You care about: ${prefs.priorities.join(", ")}.` : ""}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/start" className="btn-secondary">Edit preferences</Link>
        <MyActions />
      </div>
      <div className="mt-4"><ShareLink prefs={prefs} /></div>
      <h2 className="mt-12 text-2xl">Top results</h2>
      <ResultsSection prefs={prefs} limit={5} page="/my" />
    </main>
  );
}
