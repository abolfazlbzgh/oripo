import { once } from "node:events";
import { expect, test as base } from "@playwright/test";
import { createPreviewServer } from "../../scripts/preview.mjs";

const test = base.extend({
  // Playwright reads fixture dependencies from this destructured parameter.
  // eslint-disable-next-line no-empty-pattern
  baseURL: async ({}, use) => {
    const server = createPreviewServer().listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
      await use(`http://127.0.0.1:${address.port}`);
    } finally {
      await server[Symbol.asyncDispose]();
    }
  },
});

const documents = [
  { path: "/", heading: "Choose a language" },
  { path: "/en", heading: "A guide to paper folds" },
  { path: "/en/guide/crease-notation", heading: "Crease notation" },
];

for (const { path, heading } of documents) {
  test(`${path} serves its own document and hydrates after refresh`, async ({ page, baseURL }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || /hydration|did not match/i.test(message.text())) {
        errors.push(message.text());
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
    });
    page.on("requestfailed", (request) => errors.push(request.url()));
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== baseURL) errors.push(request.url());
    });

    for (const visit of [() => page.goto(path), () => page.reload()]) {
      const response = await visit();
      expect(response?.status()).toBe(200);
      const html = await response?.text();
      expect(html?.replace(/<br\s*\/?\s*>/gi, " ")).toContain(`<h1>${heading}</h1>`);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await page.getByLabel("Appearance").selectOption("oripo-dark");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "oripo-dark");
      await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    }
    expect(errors).toEqual([]);
  });
}

test("English navigation works at phone width with system and explicit themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.getByRole("link", { name: "English", exact: true }).click();
  await page.getByLabel("Appearance").selectOption("oripo-light");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.getByRole("link", { name: "Read the crease guide" }).click();
  await expect(page).toHaveURL(/\/en\/guide\/crease-notation$/);
  await expect(page.getByRole("heading", { name: "Crease notation" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "oripo-light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("link", { name: "Back to foundation" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.getByLabel("Appearance").selectOption("system");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});

test("unknown pages and unsupported locales return a recoverable HTTP 404", async ({ page }) => {
  for (const path of ["/en/missing", "/fr"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.getByRole("link", { name: "Choose a language" }).click();
    await expect(page).toHaveURL(/\/$/);
  }
});
