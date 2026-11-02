import { encodePrefs } from "@/lib/prefs";
import { describeError, type ErrorInfo } from "@/lib/errors";
import { runSearch, pickToken } from "@/lib/search";
import { readToken } from "@/lib/session";
import type { Preferences, RateInfo, ScoredRepo } from "@/types";
import { ErrorBanner } from "./ErrorBanner";
import { NeedToken } from "./NeedToken";
import { QuotaStatus } from "./QuotaStatus";
import { ResultsList } from "./ResultsList";
import { SetupNotice } from "./SetupNotice";

/** Server component: one GitHub search call, then scored cards. */
export async function ResultsSection({ prefs, limit, page = "/finder" }: { prefs: Preferences; limit?: number; page?: "/finder" | "/my" }) {
  const state = await readToken();
  if (!state.configured) return <SetupNotice />;
  const token = pickToken(state.token);
  if (!token) return <NeedToken next={`${page}?${encodePrefs(prefs)}`} />;

  let data: { results: ScoredRepo[]; rate: RateInfo } | null = null;
  let failure: ErrorInfo | null = null;
  try {
    data = await runSearch(prefs, token);
  } catch (error) {
    failure = describeError(error);
  }
  if (failure || !data) return <ErrorBanner info={failure ?? describeError(null)} />;

  return (
    <>
      <div className="mt-2">
        <QuotaStatus rate={data.rate} />
      </div>
      <ResultsList results={limit ? data.results.slice(0, limit) : data.results} prefs={prefs} />
    </>
  );
}
