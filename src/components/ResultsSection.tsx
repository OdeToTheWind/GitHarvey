import { encodePrefs } from "@/lib/prefs";
import { describeError, type ErrorInfo } from "@/lib/errors";
import { runSearch } from "@/lib/search";
import { readToken } from "@/lib/session";
import type { Preferences, RateInfo, ScoredRepo } from "@/types";
import { ErrorBanner } from "./ErrorBanner";
import { SignInCard } from "./SignInCard";
import { QuotaStatus } from "./QuotaStatus";
import { ResultsList } from "./ResultsList";
import { SetupNotice } from "./SetupNotice";

/** Server component: one GitHub search call, then scored cards. */
interface Props {
  prefs: Preferences;
  limit?: number;
  page?: "/finder" | "/my";
  /** A repo to leave out, used by "Find alternatives". */
  exclude?: string;
}

export async function ResultsSection({ prefs, limit, page = "/finder", exclude }: Props) {
  const state = await readToken();
  if (!state.configured) return <SetupNotice />;
  const token = state.token;
  if (!token) return <SignInCard reason="Sign in to search and score repos. You will come straight back here." next={`${page}?${encodePrefs(prefs)}${exclude ? `&not=${encodeURIComponent(exclude)}` : ""}`} />;

  let data: { results: ScoredRepo[]; rate: RateInfo } | null = null;
  let failure: ErrorInfo | null = null;
  try {
    data = await runSearch(prefs, token);
  } catch (error) {
    failure = describeError(error);
  }
  if (failure || !data) return <ErrorBanner info={failure ?? describeError(null)} />;

  const kept = exclude ? data.results.filter((r) => r.repo.fullName.toLowerCase() !== exclude.toLowerCase()) : data.results;
  return (
    <>
      <div className="mt-2">
        <QuotaStatus rate={data.rate} />
      </div>
      <ResultsList results={limit ? kept.slice(0, limit) : kept} prefs={prefs} />
    </>
  );
}
