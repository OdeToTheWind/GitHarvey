import type { ScoredRepo } from "@/types";

const BADGE = {
  green: { label: "Healthy", cls: "border-field text-field bg-field-soft" },
  yellow: { label: "Okay", cls: "border-wheat text-wheat bg-wheat-soft" },
  red: { label: "Risky", cls: "border-clay text-clay bg-clay-soft" },
} as const;

/** Word AND score, so colour is never the only signal. */
export function HealthBadge({ item }: { item: ScoredRepo }) {
  const b = BADGE[item.badge];
  return (
    <p className={`w-fit rounded-full border px-3 py-0.5 text-sm font-bold ${b.cls}`}>
      {item.repo.archived ? "Archived" : b.label} {item.score}
    </p>
  );
}
