"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decodePrefs, defaultPriorities, EXAMPLE_PREFS, encodePrefs, isValidLanguage } from "@/lib/prefs";
import { setPrefs } from "@/lib/storage";
import type { Preferences } from "@/types";
import { AudienceStep, ConfirmStep, GoalStep, PriorityStep, TopicStep } from "./OnboardingSteps";

// The last step is a review: nothing goes to GitHub until it is confirmed.
const STEPS = [AudienceStep, GoalStep, TopicStep, PriorityStep, ConfirmStep];
const TOPIC_STEP = 2;

export function Onboarding() {
  const router = useRouter();
  const [searching, startSearch] = useTransition();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Starts in default mode: no profile and no special goal, so nobody has to answer the first two questions.
  const [draft, setDraft] = useState<Preferences>({
    audience: "default",
    goal: "default",
    topic: "",
    priorities: defaultPriorities("default"),
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
    if (step === TOPIC_STEP && draft.topic.trim().length === 0) {
      setError("Enter a topic (up to 80 characters).");
      return;
    }
    if (step === TOPIC_STEP && draft.language && !isValidLanguage(draft.language)) {
      setError("Check the language: use letters, numbers, spaces and + # . - only.");
      return;
    }
    setStep((s) => s + 1);
  }

  // Runs the search. Only the confirm step calls this, so results are never shown before a confirmation.
  function confirm() {
    const prefs = { ...draft, topic: draft.topic.trim(), language: draft.language?.trim() || undefined };
    const params = encodePrefs(prefs);
    if (!decodePrefs(params).ok) {
      setError("Check your answers and try again.");
      return;
    }
    setPrefs(prefs);
    startSearch(() => router.push(`/finder?${params.toString()}`));
  }

  // The example fills in a ready-made search and goes to the review, like every other path.
  function tryExample() {
    setDraft(EXAMPLE_PREFS);
    setError(null);
    setStep(STEPS.length - 1);
  }

  // Default mode: skip "Who are you?" and "What do you want to do?" and go straight to the topic.
  function skipToSearch() {
    update({ audience: "default", goal: "default" });
    setStep(TOPIC_STEP);
  }

  // Pressing Enter moves on a step, and only searches from the review step.
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (searching) return;
    if (step === STEPS.length - 1) confirm();
    else next();
  }

  const Step = STEPS[step] ?? AudienceStep;
  const reviewing = step === STEPS.length - 1;
  return (
    <form onSubmit={submit} className="glow-card space-y-8 p-8">
      <p className="text-sm text-muted" aria-live="polite">Step {step + 1} of {STEPS.length}</p>
      <Step draft={draft} update={update} />
      {error && <p role="alert" className="text-clay">{error}</p>}
      {searching && (
        <p role="status" className="text-muted">
          <span aria-hidden="true" className="mr-2 inline-block animate-pulse text-neon">●</span>
          Searching GitHub and scoring the results. This can take a few seconds…
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        {step > 0 && <button type="button" className="btn-secondary" disabled={searching} onClick={() => setStep(step - 1)}>Back</button>}
        {/* Separate keys on purpose: if React reused one button element, "Review search" would turn into the
            submit button during its own click, and the browser would submit the form before it was confirmed. */}
        {reviewing ? (
          <button key="confirm" type="submit" className="btn-primary" disabled={searching}>{searching ? "Searching…" : "Confirm and search"}</button>
        ) : (
          <button key="next" type="button" className="btn-primary" onClick={next}>{step === STEPS.length - 2 ? "Review search" : "Next"}</button>
        )}
        {step < TOPIC_STEP && <button type="button" className="btn-secondary" onClick={skipToSearch}>Skip to search</button>}
        {step === 0 && <button type="button" className="btn-secondary" onClick={tryExample}>Try an example</button>}
      </div>
    </form>
  );
}
