"use client";

import { WEIGHT_KEYS, WEIGHT_LABELS } from "@/lib/weights";
import type { Weights } from "@/types";

interface Props {
  value: Weights;
  tuned: boolean;
  allZero: boolean;
  onChange: (next: Weights) => void;
  onReset: () => void;
}

/** Lets visitors decide how much each signal counts. The page re-scores live, in the browser. */
export function WeightSliders({ value, tuned, allZero, onChange, onReset }: Props) {
  return (
    <details className="glow-card mt-6 p-6">
      <summary className="tap cursor-pointer font-bold">Tune the score{tuned ? " (custom)" : ""}</summary>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Decide how much each signal counts. Scores on this page update at once. Your tuning is not saved and is not part of shared links.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WEIGHT_KEYS.map((key) => (
          <label key={key} className="block text-sm">
            <span className="flex justify-between">
              <span>{WEIGHT_LABELS[key]}</span>
              <span className="text-muted">{value[key]} / 10</span>
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
              className="mt-2 w-full accent-[var(--neon)]"
            />
          </label>
        ))}
      </div>
      {allZero && <p role="alert" className="mt-4 text-sm text-clay">Set at least one signal above 0.</p>}
      <button type="button" className="btn-secondary mt-5" onClick={onReset} disabled={!tuned}>Reset to the default</button>
    </details>
  );
}
