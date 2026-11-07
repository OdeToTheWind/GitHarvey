"use client";

import { useState } from "react";
import { AUDIENCES, FILTER_PRIORITIES, GOALS, isValidLanguage, LANGUAGES } from "@/lib/prefs";
import { LANGUAGE_NAMES } from "@/lib/query";
import { TOPIC_STYLES, toggleStyle } from "@/lib/topic-styles";
import type { Audience, Goal, Preferences, Priority } from "@/types";

const AUDIENCE_LABEL: Record<Audience, string> = {
  default: "Default (no profile)",
  beginner: "Beginner",
  developer: "Developer",
  security: "Security-minded",
  founder: "Founder",
};
const GOAL_LABEL: Record<Goal, string> = {
  default: "Default (just search)",
  learn: "Learn something",
  build: "Build something",
  compare: "Compare options",
  "stay-updated": "Stay updated",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  maintained: "Actively maintained",
  "beginner-friendly": "Beginner friendly",
  popular: "Popular",
  "permissive-license": "Permissive license",
  any: "Any (no filters)",
};

interface StepProps {
  draft: Preferences;
  update: (patch: Partial<Preferences>) => void;
}

function Choice({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`tap gap-2 rounded-md border px-4 ${checked ? "border-neon" : "border-line"}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export function AudienceStep({ draft, update }: StepProps) {
  return (
    <fieldset>
      <legend className="font-bold">Who are you?</legend>
      <p className="mt-2 text-sm text-muted">Not sure, or just want to search? Keep Default. It scores repos in a balanced way.</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {AUDIENCES.map((a) => (
          <Choice key={a} name="aud" label={AUDIENCE_LABEL[a]} checked={draft.audience === a} onChange={() => update({ audience: a })} />
        ))}
      </div>
    </fieldset>
  );
}

export function GoalStep({ draft, update }: StepProps) {
  return (
    <fieldset>
      <legend className="font-bold">What do you want to do?</legend>
      <p className="mt-2 text-sm text-muted">Default means no special goal: just find good repos for your topic.</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {GOALS.map((g) => (
          <Choice key={g} name="goal" label={GOAL_LABEL[g]} checked={draft.goal === g} onChange={() => update({ goal: g })} />
        ))}
      </div>
    </fieldset>
  );
}

const OTHER = "__other__";

/** A list of common languages, plus "Other" which opens a box for any language the visitor wants to type. */
function LanguageField({ draft, update }: StepProps) {
  const listed = (LANGUAGES as readonly string[]).includes(draft.language ?? "");
  const [other, setOther] = useState(() => Boolean(draft.language) && !listed);
  const invalid = other && Boolean(draft.language) && !isValidLanguage(draft.language ?? "");

  function choose(value: string) {
    setOther(value === OTHER);
    update({ language: value === OTHER || value === "" ? undefined : value });
  }

  return (
    <div>
      <label htmlFor="lang" className="font-bold">Language (optional)</label>
      <select id="lang" value={other ? OTHER : draft.language ?? ""} onChange={(e) => choose(e.target.value)} className="field-input mt-2">
        <option value="">Any</option>
        {LANGUAGES.map((l) => <option key={l} value={l}>{LANGUAGE_NAMES[l]}</option>)}
        <option value={OTHER}>Other…</option>
      </select>
      {other && (
        <div className="mt-3">
          <label htmlFor="lang-other" className="text-sm text-muted">Type the language</label>
          <input
            id="lang-other"
            value={draft.language ?? ""}
            maxLength={30}
            onChange={(e) => update({ language: e.target.value || undefined })}
            placeholder="e.g. Kotlin, Ruby, PHP, Swift"
            aria-invalid={invalid}
            aria-describedby="lang-other-hint"
            className="field-input mt-1"
          />
          <p id="lang-other-hint" className={`mt-1 text-sm ${invalid ? "text-clay" : "text-muted"}`}>
            {invalid ? "Use letters, numbers, spaces and + # . - only." : "Any language GitHub knows, spelled as GitHub spells it."}
          </p>
        </div>
      )}
    </div>
  );
}

export function TopicStep({ draft, update }: StepProps) {
  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="topic" className="font-bold">What is it about? (required)</label>
        <input id="topic" data-shortcut-focus value={draft.topic} maxLength={80} onChange={(e) => update({ topic: e.target.value })} placeholder="e.g. pdf parsing, state management" className="field-input mt-2" />
      </div>
      <fieldset>
        <legend className="font-bold">Add a style (optional)</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {TOPIC_STYLES.map((style) => {
            const on = draft.topic.toLowerCase().includes(style);
            return (
              <button key={style} type="button" aria-pressed={on} onClick={() => update({ topic: toggleStyle(draft.topic, style) })} className={`tap rounded-md border px-4 ${on ? "border-neon" : "border-line"}`}>
                {style}
              </button>
            );
          })}
        </div>
      </fieldset>
      <LanguageField draft={draft} update={update} />
    </div>
  );
}

export function PriorityStep({ draft, update }: StepProps) {
  const all = FILTER_PRIORITIES.every((p) => draft.priorities.includes(p));
  const any = draft.priorities.includes("any");
  function toggle(p: Priority) {
    // Choosing a real priority takes "Any" off: they cannot both be true.
    const rest: Priority[] = draft.priorities.filter((x) => x !== "any");
    update({ priorities: rest.includes(p) ? rest.filter((x) => x !== p) : [...rest, p] });
  }
  const box = (on: boolean) => `tap gap-2 rounded-md border px-4 ${on ? "border-neon" : "border-line"}`;
  return (
    <fieldset>
      <legend className="font-bold">What matters most?</legend>
      <div className="mt-4 flex flex-wrap gap-4">
        {FILTER_PRIORITIES.map((p) => (
          <label key={p} className={box(draft.priorities.includes(p))}>
            <input type="checkbox" checked={draft.priorities.includes(p)} onChange={() => toggle(p)} />
            {PRIORITY_LABEL[p]}
          </label>
        ))}
        {/* "All together" ticks every priority at once, and clears them all when ticked again. */}
        <label className={box(all)}>
          <input type="checkbox" checked={all} onChange={() => update({ priorities: all ? [] : [...FILTER_PRIORITIES] })} />
          All together
        </label>
        {/* "Any" is last: no filters at all, so the search covers every kind of repo. */}
        <label className={box(any)}>
          <input type="checkbox" checked={any} onChange={() => update({ priorities: any ? [] : ["any"] })} />
          Any
        </label>
      </div>
      <p className="mt-3 text-sm text-muted">Results must match every priority you pick, so choosing all of them gives fewer, stricter matches.</p>
      <p className="mt-1 text-sm text-muted">Any searches thoroughly, with no obligations: tiny, old and archived repos are included too.</p>
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** The last step: your answers in plain words. Nothing is sent to GitHub until you confirm. */
export function ConfirmStep({ draft }: StepProps) {
  return (
    <section aria-labelledby="confirm-h">
      <h3 id="confirm-h" className="font-bold">Review your search</h3>
      <p className="mt-2 text-sm text-muted">Check your answers. GitHarvey asks GitHub only after you confirm, and the results can take a few seconds.</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Row label="Who you are" value={AUDIENCE_LABEL[draft.audience]} />
        <Row label="What you want to do" value={GOAL_LABEL[draft.goal]} />
        <Row label="Topic" value={draft.topic.trim()} />
        <Row label="Language" value={draft.language?.trim() || "Any"} />
        <Row label="What matters most" value={draft.priorities.map((p) => PRIORITY_LABEL[p]).join(", ") || "Nothing in particular"} />
      </dl>
    </section>
  );
}
