import { defineConfig } from "@playwright/test";

const reportDir = process.env.ORIPO_BROWSER_REPORT ?? ".local/browser-report";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: process.env.CI ? `${reportDir}/test-results` : ".local/test-results",
  forbidOnly: true,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["github"], ["junit", { outputFile: `${reportDir}/results.xml` }]]
    : undefined,
  preserveOutput: process.env.CI ? "failures-only" : "always",
  use: process.env.CI ? { screenshot: "only-on-failure", trace: "retain-on-failure" } : {},
  // Cold software WebGL initialization can take longer than five seconds on Windows.
  expect: { timeout: 12000 },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" }, grepInvert: /@cdp\b/ },
    { name: "webkit", use: { browserName: "webkit" }, grepInvert: /@cdp\b/ },
  ],
});
