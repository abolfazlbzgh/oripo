import { expect } from "@playwright/test";
import { test } from "./preview";
import { setDark } from "./shell-helpers";

test("fresh dark-OS lesson, Guide and localized error paint light before hydration", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route("**/assets/*.js", (route) => route.abort());
  for (const path of ["/en/lessons/fox-face", "/en/guide/crease-notation", "/fa/missing"]) {
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "oripo-light");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    if (path.startsWith("/en")) {
      await expect(page.locator(".wide-control input")).toBeDisabled();
      await expect(page.locator(".wide-control .swap-off")).toHaveCSS("opacity", "1");
    }
  }
});
test("explicit selections and invalid or cleared storage synchronize between tabs", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  const second = await context.newPage();
  await second.goto("/en/guide/crease-notation");
  const html = second.locator("html");
  await setDark(page, true);
  await expect(html).toHaveCSS("color-scheme", "dark");
  await second.emulateMedia({ colorScheme: "light" });
  await second.reload();
  await expect(html).toHaveCSS("color-scheme", "dark");
  await page.evaluate(() => localStorage.setItem("oripo-appearance", "invalid"));
  await expect(html).toHaveCSS("color-scheme", "light");
  await second.reload();
  await expect(html).toHaveCSS("color-scheme", "light");
  await setDark(second, true);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.evaluate(() => localStorage.clear());
  await expect(html).toHaveCSS("color-scheme", "light");
});
test("denied storage allows a document-local choice", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Denied", "SecurityError");
      },
    }),
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await setDark(page, true);
  await page.reload();
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});
test("script-disabled mobile and desktop render the light palette and sun icon", async ({
  browser,
  baseURL,
}, info) => {
  const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false, colorScheme: "dark" });
  try {
    const page = await ctx.newPage();
    for (const width of [320, 1024]) {
      await page.setViewportSize({ width, height: 760 });
      await page.goto("/en");
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
      await expect(page.locator(".wide-control .swap-off")).toHaveCSS("opacity", "1");
      await expect(page.locator(".wide-control .swap-on")).toHaveCSS("opacity", "0");
      await page.screenshot({ path: info.outputPath("no-js-" + width + ".png") });
    }
  } finally {
    await ctx.close();
  }
});
