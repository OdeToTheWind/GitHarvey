"use client";

import type { LicenseFilter, ResultsView, SortKey } from "@/lib/results-view";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "health", label: "Health score" },
  { value: "stars", label: "Stars" },
  { value: "recent", label: "Recently pushed" },
];
const LICENSES: { value: LicenseFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "licensed", label: "Has a license" },
  { value: "permissive", label: "Permissive only" },
];
const MIN_STARS = [0, 100, 1_000, 10_000];

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}

/** Sort and filter the page of results. Runs in the browser: no new GitHub calls. */
export function ResultsToolbar({ view, onChange }: { view: ResultsView; onChange: (next: ResultsView) => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-end gap-6" role="group" aria-label="Sort and filter results">
      <Field id="sort" label="Sort by">
        <select id="sort" className="field-input mt-1" value={view.sort} onChange={(e) => onChange({ ...view, sort: e.target.value as SortKey })}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Field>
      <Field id="license" label="License">
        <select id="license" className="field-input mt-1" value={view.license} onChange={(e) => onChange({ ...view, license: e.target.value as LicenseFilter })}>
          {LICENSES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </Field>
      <Field id="stars" label="Minimum stars">
        <select id="stars" className="field-input mt-1" value={view.minStars} onChange={(e) => onChange({ ...view, minStars: Number(e.target.value) })}>
          {MIN_STARS.map((n) => <option key={n} value={n}>{n === 0 ? "Any" : n.toLocaleString("en-US")}</option>)}
        </select>
      </Field>
    </div>
  );
}
