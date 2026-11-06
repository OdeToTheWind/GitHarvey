import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

interface AxeResult {
  violations: { id: string; impact: string | null; nodes: { target: unknown[] }[] }[];
}

/**
 * Opens a page and waits until React has taken it over. In dev mode a page can show up before it is
 * interactive, and anything typed in that gap is lost, so every test starts here.
 */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "load" });
  await page.locator("html[data-ready]").waitFor({ timeout: 60_000 });
}

/** Signs in the way a visitor does: press "Sign in with GitHub", approve on (fake) GitHub, land back signed in. */
export async function signIn(page: Page): Promise<void> {
  await open(page, "/start");
  await page.getByRole("link", { name: "Sign in with GitHub" }).first().click();
  await page.getByText("You are signed in with GitHub.").waitFor();
  await page.locator("html[data-ready]").waitFor();
}

/** Serious and critical WCAG A/AA problems on the current page, as short readable strings. */
export async function accessibilityProblems(page: Page): Promise<string[]> {
  await page.evaluate(axeSource);
  const result = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (c: Document, o: object) => Promise<AxeResult> } }).axe;
    return axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] });
  });
  return result.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}
