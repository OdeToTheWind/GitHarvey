import { expect, test } from "@playwright/test";
import { accessibilityProblems, open, searchExample, signIn } from "./helpers";

const FAKE_GITHUB = "http://127.0.0.1:4010";

// The sign-in routes allow 20 attempts a minute per address. Every test signs in, so each one gets its own address.
test.beforeEach(async ({ context }) => {
  const part = () => Math.floor(Math.random() * 250) + 1;
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `10.${part()}.${part()}.${part()}` });
});

test("home page shows the banner and a GitHub link next to Compare", async ({ page }) => {
  await open(page, "/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Great repos are everywhere");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: /^GitHub \(opens/ })).toHaveAttribute("href", "https://github.com/example/githarvey");
  const labels = await nav.getByRole("link").allInnerTexts();
  expect(labels.findIndex((l) => l.includes("Compare"))).toBeLessThan(labels.findIndex((l) => l.includes("GitHub")));
});

test("signed out: Get Started and Compare ask for sign-in, and the navbar offers it", async ({ page }) => {
  await open(page, "/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Sign in with GitHub" })).toHaveAttribute("href", "/api/auth/github");
  await expect(nav.getByRole("button", { name: "Sign out" })).toHaveCount(0);

  await open(page, "/start");
  await expect(page.getByText("Sign in with GitHub to continue")).toBeVisible();
  await expect(page.getByText("Tell us what you need")).toHaveCount(0);
  await expect(page.getByLabel(/token/i)).toHaveCount(0);

  await open(page, "/compare");
  await expect(page.getByText("Sign in with GitHub to continue")).toBeVisible();
  await expect(page.locator("#repos")).toHaveCount(0);
});

test("signing in unlocks Get Started and Compare, and signing out locks them again", async ({ page }) => {
  await signIn(page);
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Sign in with GitHub" })).toHaveCount(0);
  await expect(page.getByText("Tell us what you need")).toBeVisible();

  await open(page, "/compare");
  await expect(page.locator("#repos")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText("Sign in with GitHub to continue")).toBeVisible();
  await expect(page.locator("#repos")).toHaveCount(0);
});

test("default mode skips the first two questions, and any language can be typed", async ({ page }) => {
  await signIn(page);
  await open(page, "/start");
  await expect(page.getByLabel("Default (no profile)")).toBeChecked();
  await expect(page.getByLabel("Beginner")).not.toBeChecked();

  await page.getByRole("button", { name: "Skip to search" }).click();
  await expect(page.getByText("Step 3 of 5")).toBeVisible();
  await page.locator("#topic").fill("pdf parsing");
  await page.locator("#lang").selectOption({ label: "Other…" });
  await page.locator("#lang-other").fill("go stars:>1");
  await expect(page.getByText("Use letters, numbers, spaces and + # . - only.")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Check the language")).toBeVisible();

  await page.locator("#lang-other").fill("Kotlin");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 4: "All together" ticks every priority, and unticks them all again.
  const allTogether = page.getByLabel("All together");
  await allTogether.check();
  for (const label of ["Actively maintained", "Beginner friendly", "Popular", "Permissive license"]) await expect(page.getByLabel(label)).toBeChecked();
  await allTogether.uncheck();
  await expect(page.getByLabel("Popular")).not.toBeChecked();
  await allTogether.check();

  // Step 5: nothing is searched until it is confirmed, and Back goes back without searching.
  await page.getByRole("button", { name: "Review search" }).click();
  await expect(page.getByText("Review your search")).toBeVisible();
  await expect(page.getByText("pdf parsing")).toBeVisible();
  await expect(page.getByText("Kotlin")).toBeVisible();
  await expect(page.getByText("Default (no profile)")).toBeVisible();
  await expect(page).toHaveURL(/\/start/);
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("All together")).toBeChecked();
  await page.getByRole("button", { name: "Review search" }).click();
  await page.getByRole("button", { name: "Confirm and search" }).click();
  await expect(page).toHaveURL(/aud=default/);
  await expect(page).toHaveURL(/goal=default/);
  await expect(page).toHaveURL(/lang=Kotlin/);
  await expect(page).toHaveURL(/pri=maintained%2Cbeginner-friendly%2Cpopular%2Cpermissive-license/);
  await expect(page.locator("article").first()).toBeVisible();
});

test("pressing Enter in the topic box moves to the next step instead of searching", async ({ page }) => {
  await signIn(page);
  await open(page, "/start");
  await page.getByRole("button", { name: "Skip to search" }).click();
  await page.locator("#topic").fill("pdf parsing");
  await page.locator("#topic").press("Enter");
  await expect(page.getByText("Step 4 of 5")).toBeVisible();
  await expect(page).toHaveURL(/\/start/);
});

test("signing in from the Compare page brings you back to it", async ({ page }) => {
  await open(page, "/compare?repos=acme%2Falpha%2Cacme%2Fbeta");
  await page.getByRole("link", { name: "Sign in with GitHub" }).last().click();
  await expect(page).toHaveURL(/\/compare\?repos=/);
  await expect(page.getByRole("table")).toContainText("acme/alpha");
});

test("search, expand, save, filter, tune and compare", async ({ page }) => {
  await signIn(page);
  await open(page, "/start");
  await searchExample(page);
  await expect(page).toHaveURL(/\/finder\?/);

  const cards = page.locator("article");
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText("acme/alpha");
  await expect(cards.last()).toContainText("acme/delta");
  await expect(cards.last().getByRole("link", { name: "Find alternatives" })).toHaveAttribute("href", /not=acme%2Fdelta/);

  // Expand loads the extra facts, which never change the score.
  await cards.first().getByRole("button", { name: "Expand" }).click();
  const facts = cards.first().getByRole("region", { name: /More about acme\/alpha/ });
  await expect(facts).toContainText("42");
  await expect(facts).toContainText("Rising");
  await expect(facts).toContainText("3 in package.json");

  await cards.first().getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("link", { name: "Saved (1)" })).toBeVisible();

  // Filters and sort run in the browser.
  await page.locator("#license").selectOption("permissive");
  await expect(cards).toHaveCount(2);
  await page.locator("#license").selectOption("any");
  await page.getByLabel("Sort by").selectOption("stars");
  await expect(cards.first()).toContainText("acme/alpha");

  // Tuning the score re-ranks live: with only "license" counting, the unlicensed repo falls to the bottom.
  await page.getByLabel("Sort by").selectOption("health");
  await page.getByText("Tune the score").click();
  for (const name of ["Recent activity", "Docs", "Popularity"]) await page.getByLabel(new RegExp(name)).fill("0");
  await page.getByLabel(/^License\s*\d/).fill("10");
  await expect(cards.last()).toContainText("acme/gamma");
  await page.getByRole("button", { name: "Reset to the default" }).click();
  await expect(cards.last()).toContainText("acme/delta");

  // Compare two repos, then export.
  for (const i of [0, 1]) await cards.nth(i).getByLabel("Compare").check();
  await page.getByRole("button", { name: "Compare (2)" }).click();
  await expect(page).toHaveURL(/\/compare\?/);
  const table = page.getByRole("table");
  await expect(table).toContainText("Median time to merge a PR");
  await expect(table).toContainText("Maintenance trend");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  const csv = await (await download).createReadStream().then((s) => new Promise<string>((done) => {
    const chunks: Buffer[] = [];
    s.on("data", (c: Buffer) => chunks.push(c));
    s.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
  }));
  expect(csv).toContain("acme/alpha");
  expect((csv.split("\n")[0] ?? "").split(",")).toHaveLength(3); // the corner cell plus the two repos

  await page.getByRole("link", { name: "Saved (1)" }).click();
  await expect(page.getByRole("link", { name: "acme/alpha" })).toBeVisible();
});

test("repo details page", async ({ page }) => {
  await signIn(page);
  await open(page, "/repo/acme/alpha?aud=developer");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("acme/alpha");
  await expect(page.getByRole("heading", { name: "Why this score" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Commits per week/ })).toBeVisible();
  await expect(page.getByText("Permissive", { exact: true })).toBeVisible();
});

test("the token only ever goes to GitHub's API", async ({ page, request }) => {
  await signIn(page);
  await open(page, "/repo/acme/alpha");
  const seen = await (await request.get(`${FAKE_GITHUB}/__seen`)).json();
  expect(seen.withAuth).toBeGreaterThan(0);
  expect(seen.withoutAuth).toBe(0);
  const cookies = await page.context().cookies();
  expect(JSON.stringify(cookies)).not.toContain("gho_");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("gho_");
});

test("pressing / jumps to the main input", async ({ page }) => {
  await signIn(page);
  await open(page, "/compare");
  await expect(async () => {
    await page.keyboard.press("/");
    await expect(page.locator("#repos")).toBeFocused({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
});

for (const scheme of ["light", "dark"] as const) {
  test(`no serious accessibility problems (${scheme})`, async ({ page }) => {
    test.setTimeout(240_000); // visits a dozen pages, and the dev server compiles each one the first time
    await page.emulateMedia({ colorScheme: scheme });
    await signIn(page);
    await open(page, "/start");
    await searchExample(page);
    await expect(page.locator("article")).toHaveCount(4);
    await page.locator("article").first().getByRole("button", { name: "Expand" }).click();
    await page.getByText("Tune the score").click();
    const problems: Record<string, string[]> = {};
    problems["/finder"] = await accessibilityProblems(page);
    await page.context().clearCookies();
    for (const path of ["/start", "/compare"]) {
      await open(page, path);
      problems[`${path} (signed out)`] = await accessibilityProblems(page);
    }
    await signIn(page);
    for (const path of ["/", "/start", "/compare?repos=acme%2Falpha%2Cacme%2Fbeta", "/repo/acme/alpha", "/saved", "/privacy", "/disclaimer"]) {
      await open(page, path);
      await page.locator("h1").first().waitFor();
      problems[path] = await accessibilityProblems(page);
    }
    expect(problems).toEqual(Object.fromEntries(Object.keys(problems).map((k) => [k, []])));
  });
}
