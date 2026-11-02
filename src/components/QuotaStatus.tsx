import type { RateInfo } from "@/types";

export function QuotaStatus({ rate }: { rate: RateInfo | null }) {
  if (!rate || rate.remaining === null) return null;
  const low = rate.remaining < 5;
  const reset = rate.resetAt ? new Date(rate.resetAt).toUTCString() : null;
  return (
    <p className={`text-sm ${low ? "text-clay" : "text-muted"}`} role={low ? "alert" : undefined}>
      {low ? "Warning: " : ""}GitHub requests left: {rate.remaining}
      {reset ? `, resets ${reset}` : ""}
    </p>
  );
}
