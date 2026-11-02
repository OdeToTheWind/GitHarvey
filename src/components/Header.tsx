"use client";

import Link from "next/link";
import { useStoredPrefs } from "@/lib/use-stored";
import { RemoveTokenButton } from "./RemoveTokenButton";

function GitHubMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function Header({ hasToken, repo }: { hasToken: boolean; repo: string | null }) {
  const prefs = useStoredPrefs();
  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <Link href="/" className="tap text-xl font-bold">
        GitHarvey<span className="text-neon">_</span>
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-7 text-sm">
        <Link href="/compare" className="tap underline-offset-4 hover:underline">Compare</Link>
        {repo && (
          <a href={repo} target="_blank" rel="noopener noreferrer" className="tap inline-flex items-center gap-2 underline-offset-4 hover:underline">
            <GitHubMark />
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {prefs && <Link href="/my" className="tap underline-offset-4 hover:underline">Your page</Link>}
        {hasToken && <RemoveTokenButton className="tap underline underline-offset-4" />}
      </nav>
    </header>
  );
}
