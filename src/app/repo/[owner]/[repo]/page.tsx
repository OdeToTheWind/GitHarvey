import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Cat } from "@/components/Cat";
import { ErrorBanner } from "@/components/ErrorBanner";
import { SignInCard } from "@/components/SignInCard";
import { RepoDetails } from "@/components/RepoDetails";
import { SetupNotice } from "@/components/SetupNotice";
import { describeError } from "@/lib/errors";
import { repoHref } from "@/lib/links";
import { decodeScoring } from "@/lib/prefs";
import { isValidRepoName } from "@/lib/repoName";
import { loadScoredRepo } from "@/lib/search";
import { readToken } from "@/lib/session";

export const metadata: Metadata = { title: "Repo details", robots: { index: false } };

type Props = {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load(fullName: string, token: string, scoring: ReturnType<typeof decodeScoring>) {
  try {
    return { loaded: await loadScoredRepo(fullName, token, scoring), failure: null };
  } catch (error) {
    return { loaded: null, failure: describeError(error) };
  }
}

export default async function RepoPage({ params, searchParams }: Props) {
  const { owner, repo: name } = await params;
  const fullName = `${owner}/${name}`;
  if (!isValidRepoName(fullName)) notFound();

  const scoring = decodeScoring(await searchParams);
  const state = await readToken();
  const result = state.configured && state.token ? await load(fullName, state.token, scoring) : null;

  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <Cat name="score" size={88} />
      <h1 className="text-4xl">{fullName}</h1>
      {!state.configured && <SetupNotice />}
      {state.configured && !state.token && <SignInCard reason="Sign in to see this repo's score and facts." next={repoHref(fullName, scoring)} />}
      {result?.failure && <ErrorBanner info={result.failure} />}
      {result?.loaded && <RepoDetails scored={result.loaded.scored} extras={result.loaded.extras} scoring={scoring} />}
    </main>
  );
}
