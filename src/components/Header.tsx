"use client";

import Link from "next/link";
import { useStoredPrefs } from "@/lib/use-stored";
import { RemoveTokenButton } from "./RemoveTokenButton";

export function Header({ hasToken }: { hasToken: boolean }) {
  const prefs = useStoredPrefs();
  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8 lg:px-12">
      <Link href="/" className="tap text-xl font-bold">
        GitHarvey<span className="text-neon">_</span>
      </Link>
      <nav aria-label="Main" className="flex flex-wrap items-center gap-x-5 text-sm">
        <Link href="/compare" className="tap underline-offset-4 hover:underline">Compare</Link>
        {prefs && <Link href="/my" className="tap underline-offset-4 hover:underline">Your page</Link>}
        {hasToken && <RemoveTokenButton className="tap underline underline-offset-4" />}
      </nav>
    </header>
  );
}
