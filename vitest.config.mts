import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname) } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/db/**/*.test.ts"],
    globalSetup: ["tests/db/global-setup.ts"],
    environment: "node",
    // DB tests share one local database, so run files one at a time.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
