import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResultsSection } from "@/components/ResultsSection";
import { decodePrefs } from "@/lib/prefs";
import { Cat } from "@/components/Cat";

export const metadata: Metadata = { title: "Results" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function FinderPage({ searchParams }: Props) {
  const decoded = decodePrefs(await searchParams);
  if (!decoded.ok) redirect("/start");
  const { prefs } = decoded;
  return (
    <main className="w-full px-5 sm:px-8 lg:px-12 pb-16">
      <Cat name="search" size={88} />
      <h1 className="text-4xl">Results for “{prefs.topic}”</h1>
      <p className="mt-2 text-muted">
        <Link href="/start" className="text-neon underline underline-offset-4">Change answers</Link>
      </p>
      <ResultsSection prefs={prefs} />
    </main>
  );
}
