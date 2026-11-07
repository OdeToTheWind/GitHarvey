import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { describePrefs } from "@/lib/describe";
import { decodePrefs, defaultPriorities, encodePrefs } from "@/lib/prefs";
import { PROFILES, weightsFor } from "@/lib/profiles";
import { buildSearchQuery } from "@/lib/query";
import type { Preferences } from "@/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, refresh: () => {} }) }));

import { Onboarding } from "@/components/Onboarding";
import { AudienceStep, GoalStep, TopicStep } from "@/components/OnboardingSteps";

const NOW = new Date("2026-11-02T00:00:00Z");
const base: Preferences = { audience: "default", goal: "default", topic: "pdf", priorities: [] };
const noop = () => {};

describe("default mode", () => {
  it("has balanced weights that add up to 1, and changes nothing about the goal", () => {
    const w = PROFILES.default;
    expect(w.recency + w.license + w.docs + w.popularity).toBeCloseTo(1);
    expect(weightsFor("default", "default")).toEqual(w);
  });
  it("is offered as the first choice in both questions, with an explanation", () => {
    const aud = renderToStaticMarkup(createElement(AudienceStep, { draft: base, update: noop }));
    const goal = renderToStaticMarkup(createElement(GoalStep, { draft: base, update: noop }));
    expect(aud).toContain("Default (no profile)");
    expect(aud.indexOf("Default (no profile)")).toBeLessThan(aud.indexOf("Beginner"));
    expect(goal).toContain("Default (just search)");
    expect(aud).toMatch(/checked[^>]*>\s*Default/);
  });
  it("starts the form in default mode and lets people skip straight to the search", () => {
    const html = renderToStaticMarkup(createElement(Onboarding));
    expect(html).toContain("Skip to search");
    expect(html).toContain("Default (no profile)");
    expect(defaultPriorities("default")).toEqual(["maintained"]);
  });
  it("survives a round trip through the address, and searches without any profile-specific filters", () => {
    const decoded = decodePrefs(encodePrefs(base));
    expect(decoded.ok && decoded.prefs.audience).toBe("default");
    const query = buildSearchQuery(base, NOW);
    expect(query).toBe("pdf archived:false stars:>10");
  });
  it("is described honestly on Your page", () => {
    expect(describePrefs(base)).toBe("You are searching in default mode with “pdf”.");
    expect(describePrefs({ ...base, goal: "learn", language: "Kotlin" })).toBe("You want to learn with “pdf” in Kotlin.");
    expect(describePrefs({ ...base, audience: "founder" })).toBe("You are a founder with “pdf”.");
    expect(describePrefs({ ...base, audience: "beginner", goal: "stay-updated", priorities: ["maintained"] })).toBe(
      "You are a beginner who wants to stay updated with “pdf”. You care about: maintained.",
    );
  });
});

describe("other language", () => {
  it("is offered in the list, and the box for typing appears for a language that is not listed", () => {
    const listed = renderToStaticMarkup(createElement(TopicStep, { draft: { ...base, language: "python" }, update: noop }));
    expect(listed).toContain("Other…");
    expect(listed).toContain("C++");
    expect(listed).not.toContain("Type the language");
    const typed = renderToStaticMarkup(createElement(TopicStep, { draft: { ...base, language: "Kotlin" }, update: noop }));
    expect(typed).toContain("Type the language");
    expect(typed).toContain('placeholder="e.g. Kotlin, Ruby, PHP, Swift"');
    expect(typed).toContain('value="Kotlin"');
  });
  it("warns, without throwing, about characters it will not search for", () => {
    const html = renderToStaticMarkup(createElement(TopicStep, { draft: { ...base, language: "go stars:>1" }, update: noop }));
    expect(html).toContain("Use letters, numbers, spaces and + # . - only.");
    expect(html).toContain('aria-invalid="true"');
  });
  it("searches GitHub for the typed language, quoting names with spaces and never adding qualifiers", () => {
    expect(buildSearchQuery({ ...base, language: "Kotlin" }, NOW)).toContain(" language:Kotlin");
    expect(buildSearchQuery({ ...base, language: "Jupyter Notebook" }, NOW)).toContain(' language:"Jupyter Notebook"');
    expect(buildSearchQuery({ ...base, language: "cpp" }, NOW)).toContain(" language:C++");
    const sneaky = buildSearchQuery({ ...base, language: 'x" stars:>0 user:y' }, NOW);
    expect(sneaky).not.toContain('"x"');
    expect(sneaky.match(/language:/g)).toHaveLength(1);
    expect(sneaky).not.toContain(":>0 user:y\"");
  });
});
