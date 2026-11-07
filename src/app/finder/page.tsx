import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResultsSection } from "@/components/ResultsSection";
import { decodePrefs } from "@/lib/prefs";
import { isValidRepoName } from "@/lib/repoName";
import { Cat } from "@/components/Cat";

export const metadata: Metadata = { title: "Results", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FinderPage({ searchParams }: Props) {
  const params = await searchParams;
  const decoded = decodePrefs(params);
  if (!decoded.ok) redirect("/search-repo");
  const { prefs } = decoded;
  const not = Array.isArray(params.not) ? params.not[0] : params.not;
  const exclude = not && isValidRepoName(not) ? not : undefined;
  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-24 sm:pb-32">
      <Cat name="search" size={88} />
      <h1 className="text-4xl">Results for “{prefs.topic}”</h1>
      <p className="mt-4 text-muted">
        <Link href="/search-repo" className="text-neon underline underline-offset-4">Change answers</Link>
        {exclude && <> · Showing repos like {exclude}, without {exclude} itself.</>}
      </p>
      <ResultsSection prefs={prefs} exclude={exclude} />
    </main>
  );
}
