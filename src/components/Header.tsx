"use client";

import Link from "next/link";
import { useShortlist, useStoredPrefs } from "@/lib/use-stored";
import { GitHubMark } from "./GitHubMark";
import { SignInLink } from "./SignInLink";
import { SignOutButton } from "./SignOutButton";

export function Header({ hasToken, repo }: { hasToken: boolean; repo: string | null }) {
  const prefs = useStoredPrefs();
  const saved = useShortlist();
  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <Link href="/" className="tap text-xl font-bold">
        GitHarvey<span className="text-neon">_</span>
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 text-sm">
        <Link href="/search-repo" className="tap underline-offset-4 hover:underline">Search your repo</Link>
        <Link href="/compare" className="tap underline-offset-4 hover:underline">Compare</Link>
        {repo && (
          <a href={repo} target="_blank" rel="noopener noreferrer" className="tap inline-flex items-center gap-2 underline-offset-4 hover:underline">
            <GitHubMark />
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {saved.length > 0 && <Link href="/saved" className="tap underline-offset-4 hover:underline">Saved ({saved.length})</Link>}
        {prefs && <Link href="/my" className="tap underline-offset-4 hover:underline">Your page</Link>}
        {hasToken ? <SignOutButton className="tap underline underline-offset-4" /> : <SignInLink className="btn-secondary" />}
      </nav>
    </header>
  );
}
