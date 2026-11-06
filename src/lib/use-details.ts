"use client";

import { useCallback, useState } from "react";
import type { RepoDetails } from "@/types";
import { getJson } from "./client-api";

/** Loads the extra facts for one repo, once, when asked. */
export function useRepoDetails(fullName: string) {
  const [details, setDetails] = useState<RepoDetails | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (details || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      setDetails(await getJson<RepoDetails>(`/api/details?name=${encodeURIComponent(fullName)}`));
    } catch {
      setFailed(true);
    }
    setBusy(false);
  }, [details, busy, fullName]);

  return { details, busy, failed, load };
}
