import type { Metadata } from "next";
import { Cards } from "@/components/landing/Cards";
import { repoUrl } from "@/lib/site";
import { DISCLAIMER_SECTIONS } from "./sections";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  const repo = repoUrl();
  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <h1 className="text-4xl">Disclaimer</h1>
      <p className="mt-5 max-w-3xl text-muted">
        How GitHarvey uses the GitHub API, and what its results do and do not mean.
      </p>
      <Cards id="disclaimer-h" heading="What you should know" items={DISCLAIMER_SECTIONS} columns={4} />
      {repo && (
        <p className="mt-8">
          Source code:{" "}
          <a href={repo} rel="noopener noreferrer" className="text-neon underline underline-offset-4">
            {repo}
          </a>
        </p>
      )}
    </main>
  );
}
