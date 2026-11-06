import { healthLabel } from "@/lib/score";
import type { ScoredRepo } from "@/types";

const STYLE = {
  green: "border-field text-field bg-field-soft",
  yellow: "border-wheat text-wheat bg-wheat-soft",
  red: "border-clay text-clay bg-clay-soft",
} as const;

/** Word AND score, so colour is never the only signal. */
export function HealthBadge({ item }: { item: ScoredRepo }) {
  return (
    <p className={`w-fit rounded-full border px-3 py-0.5 text-sm font-bold ${STYLE[item.badge]}`}>
      {healthLabel(item)} {item.score}
    </p>
  );
}
