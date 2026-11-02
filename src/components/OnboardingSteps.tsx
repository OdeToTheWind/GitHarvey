import { AUDIENCES, GOALS, LANGUAGES, PRIORITIES } from "@/lib/prefs";
import type { Audience, Goal, Preferences, Priority } from "@/types";

const AUDIENCE_LABEL: Record<Audience, string> = {
  beginner: "Beginner",
  developer: "Developer",
  security: "Security-minded",
  founder: "Founder",
};
const GOAL_LABEL: Record<Goal, string> = {
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
      <div className="mt-3 flex flex-wrap gap-3">
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
      <div className="mt-3 flex flex-wrap gap-3">
        {GOALS.map((g) => (
          <Choice key={g} name="goal" label={GOAL_LABEL[g]} checked={draft.goal === g} onChange={() => update({ goal: g })} />
        ))}
      </div>
    </fieldset>
  );
}

export function TopicStep({ draft, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="topic" className="font-bold">What is it about? (required)</label>
        <input id="topic" value={draft.topic} maxLength={80} onChange={(e) => update({ topic: e.target.value })} placeholder="e.g. pdf parsing, state management" className="field-input mt-2" />
      </div>
      <div>
        <label htmlFor="lang" className="font-bold">Language (optional)</label>
        <select id="lang" value={draft.language ?? ""} onChange={(e) => update({ language: (e.target.value || undefined) as Preferences["language"] })} className="field-input mt-2">
          <option value="">Any</option>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>
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
      <div className="mt-3 flex flex-wrap gap-3">
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
