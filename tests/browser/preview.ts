import { randomInt } from "node:crypto";
import { once } from "node:events";
import { test as base, type Page } from "@playwright/test";
import { createPreviewServer } from "../../scripts/preview.mjs";

async function openBrowserPreview() {
  const server = createPreviewServer();
  // Some hosts assign a browser-blocked service port to listen(0), even on loopback.
  for (let attempt = 1; ; attempt++) {
    server.listen(randomInt(49152, 65536), "127.0.0.1");
    try {
      await once(server, "listening");
      return server;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (attempt >= 10 || (code !== "EADDRINUSE" && code !== "EACCES")) throw error;
    }
  }
}

export const test = base.extend({
  // Playwright reads fixture dependencies from this destructured parameter.
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use) => {
    const server = await openBrowserPreview();
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
      await use(`http://127.0.0.1:${address.port}`);
    } finally {
      await server[Symbol.asyncDispose]();
    }
  },
});

export function watchBrowser(page: Page, baseURL: string | undefined, javaScriptEnabled = true) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydrat(?:ion|ing)|did not match/i.test(message.text())) {
      errors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    // Chromium reports blocked module preloads as CSP failures when JavaScript is disabled.
    const reason = request.failure()?.errorText;
    if (!javaScriptEnabled && request.resourceType() === "script" && reason === "csp") return;
    errors.push(`${reason} ${request.url()}`);
  });
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== baseURL) errors.push(request.url());
  });
  return errors;
}
