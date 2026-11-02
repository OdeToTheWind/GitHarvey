"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { decodePrefs, defaultPriorities, encodePrefs } from "@/lib/prefs";
import { setPrefs } from "@/lib/storage";
import type { Preferences } from "@/types";
import { AudienceStep, GoalStep, PriorityStep, TopicStep } from "./OnboardingSteps";

const STEPS = [AudienceStep, GoalStep, TopicStep, PriorityStep];

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Preferences>({
    audience: "developer",
    goal: "build",
    topic: "",
    priorities: defaultPriorities("developer"),
  });

  function update(patch: Partial<Preferences>) {
    // Changing audience resets priorities to that audience's defaults.
    setDraft((d) => ({
      ...d,
      ...patch,
      ...(patch.audience && patch.audience !== d.audience ? { priorities: defaultPriorities(patch.audience) } : {}),
    }));
    setError(null);
  }

  function next() {
    if (step === 2 && draft.topic.trim().length === 0) {
      setError("Enter a topic (up to 80 characters).");
      return;
    }
    setStep((s) => s + 1);
  }

  function finish(event: React.FormEvent) {
    event.preventDefault();
    const prefs = { ...draft, topic: draft.topic.trim() };
    const params = encodePrefs(prefs);
    if (!decodePrefs(params).ok) {
      setError("Check your answers and try again.");
      return;
    }
    setPrefs(prefs);
    router.push(`/finder?${params.toString()}`);
  }

  const Step = STEPS[step] ?? AudienceStep;
  const last = step === STEPS.length - 1;
  return (
    <form onSubmit={finish} className="glow-card space-y-8 p-8">
      <p className="text-sm text-muted" aria-live="polite">Step {step + 1} of {STEPS.length}</p>
      <Step draft={draft} update={update} />
      {error && <p role="alert" className="text-clay">{error}</p>}
      <div className="flex gap-3">
        {step > 0 && <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>}
        {last ? (
          <button type="submit" className="btn-primary">Find repos</button>
        ) : (
          <button type="button" className="btn-primary" onClick={next}>Next</button>
        )}
      </div>
    </form>
  );
}
