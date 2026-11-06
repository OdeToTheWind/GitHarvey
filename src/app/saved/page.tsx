import type { Metadata } from "next";
import { Cat } from "@/components/Cat";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = { title: "Saved repos", robots: { index: false } };

export default function SavedPage() {
  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <Cat name="ranking" size={88} />
      <h1 className="text-4xl">Saved repos</h1>
      <p className="mt-4 max-w-3xl text-muted">Your shortlist lives in this browser only. There is no account and no copy on a server.</p>
      <SavedList />
    </main>
  );
}
