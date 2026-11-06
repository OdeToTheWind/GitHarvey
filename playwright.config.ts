import { defineConfig } from "@playwright/test";

const APP_PORT = 3100;
const GITHUB_PORT = 4010;

// Browser tests run the real app (dev mode) against a fake GitHub on this machine, using Chrome
// as installed. Nothing reaches the real GitHub, and no real token is needed.
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${APP_PORT}`, channel: "chrome", trace: "retain-on-failure" },
  webServer: [
    {
      command: "node e2e/fake-github.mjs",
      env: { FAKE_GITHUB_PORT: String(GITHUB_PORT) },
      url: `http://127.0.0.1:${GITHUB_PORT}/__seen`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next dev --port ${APP_PORT}`,
      env: {
        NEXT_DIST_DIR: ".next-e2e",
        SESSION_SECRET: "e2e-only-secret-e2e-only-secret-e2e-only",
        GITHARVEY_GITHUB_API: `http://127.0.0.1:${GITHUB_PORT}`,
        GITHARVEY_GITHUB_OAUTH: `http://127.0.0.1:${GITHUB_PORT}`,
        GITHUB_CLIENT_ID: "e2e-client-id",
        GITHUB_CLIENT_SECRET: "e2e-client-secret",
        NEXT_PUBLIC_REPO_URL: "https://github.com/example/githarvey",
        NEXT_TELEMETRY_DISABLED: "1",
      },
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
