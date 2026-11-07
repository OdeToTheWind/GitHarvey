import type { Metadata } from "next";
import Link from "next/link";
import { Cat } from "@/components/Cat";
import { CompareForm } from "@/components/CompareForm";
import { CompareExport } from "@/components/CompareExport";
import { CompareTable } from "@/components/CompareTable";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { SignInCard } from "@/components/SignInCard";
import { SetupNotice } from "@/components/SetupNotice";
import { FULL_FACTS_UP_TO, MAX_COMPARE, MIN_COMPARE, verdict } from "@/lib/compare";
import { exportTable } from "@/lib/compare-rows";
import { toCsv, toMarkdown } from "@/lib/compare-export";
import { describeError, type ErrorInfo } from "@/lib/errors";
import { parseCompare } from "@/lib/format";
import { compareHref } from "@/lib/links";
import { decodeScoring } from "@/lib/prefs";
import { loadScoredRepo } from "@/lib/search";
import { readToken } from "@/lib/session";
import type { RepoExtras, ScoredRepo, ScoringPrefs } from "@/types";

export const metadata: Metadata = { title: "Compare repos", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function loadAll(names: string[], token: string, scoring: ScoringPrefs, lite: boolean) {
  const settled = await Promise.allSettled(names.map((n) => loadScoredRepo(n, token, scoring, lite)));
  const items: ScoredRepo[] = [];
  const extras: RepoExtras[] = [];
  const missing: string[] = [];
  let failure: ErrorInfo | null = null;
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      items.push(r.value.scored);
      extras.push(r.value.extras);
    } else {
      const info = describeError(r.reason);
      if (info.notFound) missing.push(names[i] ?? "");
      else failure = info;
    }
  });
  return { items, extras, missing, failure };
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const rawParam = params.repos;
  const raw = (Array.isArray(rawParam) ? rawParam[0] : rawParam) ?? "";
  const parsed = parseCompare(raw);
  const scoring = decodeScoring(params);
  const state = await readToken();
  const token = state.configured ? state.token : null;
  // Past a handful of repos the slower extra facts are skipped, to stay within GitHub's limits.
  const lite = parsed.ok && parsed.names.length > FULL_FACTS_UP_TO;
  const loaded = parsed.ok && token ? await loadAll(parsed.names, token, scoring, lite) : null;

  const table = loaded && !loaded.failure ? exportTable(loaded.items, loaded.extras, lite) : null;

  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <Cat name="compare" size={88} />
      <h1 className="text-4xl">Compare repos</h1>
      {!state.configured && <SetupNotice />}
      {state.configured && !token && (
        <SignInCard reason="Comparing repos reads their details from GitHub, so you need to sign in first." next={parsed.ok ? compareHref(parsed.names, scoring) : "/compare"} />
      )}
      {token && <CompareForm initial={raw} scoring={scoring} />}
      {token && <p className="mt-2 text-sm text-muted">Enter {MIN_COMPARE} to {MAX_COMPARE} repos. Scores use your answers ({scoring.audience}).</p>}
      {token && raw && !parsed.ok && (
        <p role="alert" className="mt-8 text-clay">
          {parsed.reason === "too-many"
            ? `You entered more than ${MAX_COMPARE} repos. GitHarvey compares up to ${MAX_COMPARE} at a time: remove some and try again.`
            : `Enter ${MIN_COMPARE} to ${MAX_COMPARE} valid repos like owner/repo.`}{" "}
          <Link href="/search-repo" className="underline">Back to start</Link>
        </p>
      )}
      {loaded?.failure && <ErrorBanner info={loaded.failure} />}
      {loaded && !loaded.failure && (
        <div className="mt-12 space-y-6">
          {loaded.items.length >= MIN_COMPARE ? (
            <>
              <p className="text-sm text-muted">{verdict(loaded.items)}</p>
              {lite && (
                <p role="status" className="text-sm text-muted">
                  With more than {FULL_FACTS_UP_TO} repos, the slower facts (contributors, merge time, trend, good first issues, dependencies) are left out to stay within GitHub&apos;s limits. Compare {FULL_FACTS_UP_TO} or fewer to see them.
                </p>
              )}
              <CompareTable items={loaded.items} extras={loaded.extras} lite={lite} />
              {table && <CompareExport markdown={toMarkdown(table)} csv={toCsv(table)} />}
              <CopyLinkButton label="Copy link to this comparison" />
            </>
          ) : (
            <p className="text-muted">Could not load enough repos to compare.</p>
          )}
          {loaded.missing.length > 0 && (
            <p role="status" className="text-sm text-muted">Not found on GitHub: {loaded.missing.join(", ")}</p>
          )}
        </div>
      )}
    </main>
  );
}
