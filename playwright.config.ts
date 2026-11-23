import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: ".local/test-results",
  forbidOnly: true,
  workers: 1,
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" }, grepInvert: /@cdp\b/ },
    { name: "webkit", use: { browserName: "webkit" }, grepInvert: /@cdp\b/ },
  ],
});
