import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";

const documents = [
  { path: "/", heading: "Choose a language" },
  { path: "/en", heading: "Origami in motion." },
  { path: "/en/guide/crease-notation", heading: "Crease notation" },
];

for (const { path, heading } of documents) {
  test(`${path} serves its own document and hydrates after refresh`, async ({ page, baseURL }) => {
    const errors = watchBrowser(page, baseURL);

    for (const visit of [() => page.goto(path), () => page.reload()]) {
      const response = await visit();
      expect(response?.status()).toBe(200);
      const html = await response?.text();
      expect(html?.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, "")).toBe(
        heading,
      );
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
  await page.getByRole("link", { name: "Crease notation", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/guide\/crease-notation$/);
  await expect(page.getByRole("heading", { name: "Crease notation" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "oripo-light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("link", { name: "Back to Explore" }).click();
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
