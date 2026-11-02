import type { Metadata } from "next";
import Link from "next/link";
import { Cat } from "@/components/Cat";
import { CompareForm } from "@/components/CompareForm";
import { CompareTable } from "@/components/CompareTable";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { NeedToken } from "@/components/NeedToken";
import { SetupNotice } from "@/components/SetupNotice";
import { verdict } from "@/lib/compare";
import { describeError, type ErrorInfo } from "@/lib/errors";
import { parseCompare } from "@/lib/format";
import { compareHref } from "@/lib/links";
import { decodeScoring } from "@/lib/prefs";
import { loadScoredRepo } from "@/lib/search";
import { readToken } from "@/lib/session";
import type { ScoredRepo, ScoringPrefs } from "@/types";

export const metadata: Metadata = { title: "Compare repos" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function loadAll(names: string[], token: string, scoring: ScoringPrefs) {
  const settled = await Promise.allSettled(names.map((n) => loadScoredRepo(n, token, scoring)));
  const items: ScoredRepo[] = [];
  const missing: string[] = [];
  let failure: ErrorInfo | null = null;
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(r.value);
    else {
      const info = describeError(r.reason);
      if (info.notFound) missing.push(names[i] ?? "");
      else failure = info;
    }
  });
  return { items, missing, failure };
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const rawParam = params.repos;
  const raw = (Array.isArray(rawParam) ? rawParam[0] : rawParam) ?? "";
  const parsed = parseCompare(raw);
  const scoring = decodeScoring(params);
  const state = parsed.ok ? await readToken() : { configured: true, token: null };
  const token = parsed.ok && state.configured ? state.token : null;
  const loaded = parsed.ok && token ? await loadAll(parsed.names, token, scoring) : null;

  return (
    <main className="w-full px-5 pb-24 sm:pb-32 sm:px-8 lg:px-12">
      <Cat name="compare" size={88} />
      <h1 className="text-4xl">Compare repos</h1>
      <CompareForm initial={raw} scoring={scoring} />
      <p className="mt-2 text-sm text-muted">Enter two or three repos. Scores use your answers ({scoring.audience}).</p>
      {raw && !parsed.ok && (
        <p role="alert" className="mt-8 text-clay">
          Enter 2 or 3 valid repos like owner/repo. <Link href="/start" className="underline">Back to start</Link>
        </p>
      )}
      {parsed.ok && !state.configured && <SetupNotice />}
      {parsed.ok && state.configured && !token && <NeedToken next={compareHref(parsed.names, scoring)} />}
      {loaded?.failure && <ErrorBanner info={loaded.failure} />}
      {loaded && !loaded.failure && (
        <div className="mt-12 space-y-6">
          {loaded.items.length >= 2 ? (
            <>
              <p className="text-sm text-muted">{verdict(loaded.items)}</p>
              <CompareTable items={loaded.items} />
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
