import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Native tsconfig "paths" support (the "@/..." alias).
    tsconfigPaths: true,
    alias: {
      // 'server-only' throws outside Next's server build; stub it for unit tests.
      "server-only": fileURLToPath(new URL("./src/__tests__/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/__tests__/**/*.test.{ts,tsx}"],
  },
});
