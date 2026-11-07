"use client";

import { useState } from "react";
import { AUDIENCES, GOALS, isValidLanguage, LANGUAGES, PRIORITIES } from "@/lib/prefs";
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
  function toggle(p: Priority) {
    const has = draft.priorities.includes(p);
    update({ priorities: has ? draft.priorities.filter((x) => x !== p) : [...draft.priorities, p] });
  }
  return (
    <fieldset>
      <legend className="font-bold">What matters most?</legend>
      <div className="mt-4 flex flex-wrap gap-4">
        {PRIORITIES.map((p) => (
          <label key={p} className={`tap gap-2 rounded-md border px-4 ${draft.priorities.includes(p) ? "border-neon" : "border-line"}`}>
            <input type="checkbox" checked={draft.priorities.includes(p)} onChange={() => toggle(p)} />
            {PRIORITY_LABEL[p]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
