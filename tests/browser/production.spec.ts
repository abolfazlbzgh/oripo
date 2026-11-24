import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { setDark } from "./shell-helpers";

const documents = [
  { path: "/", heading: "One sheet. Endless possibilities." },
  { path: "/en", heading: "One sheet. Endless possibilities." },
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
      await setDark(page, true);
      await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    }
    expect(errors).toEqual([]);
  });
}
test("English navigation works at phone width with default and explicit themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await setDark(page, false);
  await page.getByRole("button", { name: "Site menu" }).click();
  await page.getByRole("banner").getByRole("link", { name: "Guide", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/guide\/crease-notation$/);
  await expect(page.getByRole("heading", { name: "Crease notation" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "oripo-light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("link", { name: "Back to Explore" }).click();
  await expect(page).toHaveURL(/\/en#models$/);
  await setDark(page, true);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
});
test("unknown pages and unsupported locales return a recoverable HTTP 404", async ({ page }) => {
  for (const [path, code] of [
    ["/en/missing", "en"],
    ["/__spa-fallback.html", "en"],
    ["/it", "en"],
    ["/en/lessons/missing-dart", "en"],
    ["/it/lessons/paper-airplane", "en"],
    ["/it/lessons/paper-heart", "en"],
    ["/it/lessons/fox-face", "en"],
    ["/fr/lessons/unknown-model", "fr"],
    ["/fa/wrong", "fa"],
  ] as const) {
    for (const visit of [() => page.goto(path), () => page.reload()]) {
      expect((await visit())?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("lang", code);
      await expect(page.locator("h1")).toHaveText(
        code === "fr" ? "Page introuvable" : code === "fa" ? "صفحه پیدا نشد" : "Page not found",
      );
    }
    await page.locator(`main a[href="/${code}#models"]`).click();
    await expect(page.locator("#models")).toBeVisible();
  }
});
