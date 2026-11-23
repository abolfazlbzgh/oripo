import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: ".local/test-results",
  use: { browserName: "chromium" },
});
