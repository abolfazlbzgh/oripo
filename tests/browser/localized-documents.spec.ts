import { readdirSync } from "node:fs";
import { readCopy } from "./locale-copy";
import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { locales, localeCodes } from "../../app/i18n/locales";
import type { Common, Transcript } from "../../app/i18n/messages";
import { canonicalPaths, localPath, prerenderPaths, publicPages } from "../../app/navigation";
import { siteOrigin } from "../../app/site";
import { airplaneText, sheetText } from "../../app/lesson/airplane.en";
import { heartText, heartSheet } from "../../app/lesson/heart.en";
import { foxText, foxSheet } from "../../app/lesson/fox.en";

const origin = siteOrigin(process.env.ORIPO_SITE_URL);
const english = {
  "paper-airplane": { sheet: sheetText, steps: airplaneText },
  "paper-heart": { sheet: heartSheet, steps: heartText },
  "fox-face": { sheet: foxSheet, steps: foxText },
};
test.describe("first HTTP documents", () => {
  test.use({ javaScriptEnabled: false });
  for (const code of localeCodes)
    test(`${code} serves each translation, transcript and alternate before hydration`, async ({
      page,
      baseURL,
    }) => {
      const common: Common = readCopy(code, "common");
      const errors = watchBrowser(page, baseURL, false);
      for (const logical of publicPages) {
        const path = localPath(code, logical);
        for (const visit of [() => page.goto(path), () => page.reload()]) {
          expect((await visit())?.status()).toBe(200);
          await expect(page.locator("html")).toHaveAttribute("lang", code);
          await expect(page.locator("html")).toHaveAttribute("dir", locales[code].dir);
          const title =
            logical === "foundation"
              ? common.home.tagline
              : logical === "creaseGuide"
                ? common.guide.title
                : common.models[logical].title;
          await expect(page).toHaveTitle(title + " · Oripo");
          const description =
            logical === "foundation"
              ? common.seo.home
              : logical === "creaseGuide"
                ? common.guide.intro
                : common.models[logical].summary;
          await expect(page.locator('meta[name="description"]')).toHaveAttribute(
            "content",
            description,
          );
          await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
            "href",
            origin + path,
          );
          expect(
            await page
              .locator("link[hreflang]")
              .evaluateAll((nodes) =>
                nodes.map((n) => [n.getAttribute("hreflang"), n.getAttribute("href")]),
              ),
          ).toEqual([
            ...localeCodes.map((c) => [c, origin + localPath(c, logical)]),
            ["x-default", origin + (logical === "foundation" ? "/" : localPath("en", logical))],
          ]);
          if (logical === "foundation") {
            await expect(page.locator("h1")).toHaveText(
              common.home.title + " " + common.home.emphasis,
            );
            await expect(page.locator("#models")).toHaveText(common.home.gallery);
            await expect(page.locator(".library article")).toHaveCount(3);
          } else if (logical === "creaseGuide") {
            await expect(page.locator("h1")).toHaveText(title);
            await expect(page.locator("dd")).toHaveText([
              common.guide.valleyText,
              common.guide.mountainText,
            ]);
          } else {
            const copy: Transcript = code === "en" ? english[logical] : readCopy(code, logical);
            await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
            await expect(page.locator(".studio-placeholder")).toContainText(copy.sheet.instruction);
            const rows = page.locator(".lesson-transcript li");
            await expect(rows).toHaveCount(Object.keys(copy.steps).length);
            expect(await rows.locator("strong").allTextContents()).toEqual(
              Object.values(copy.steps).map((step) => step.title),
            );
            expect(await rows.locator("p").allTextContents()).toEqual(
              Object.values(copy.steps).flatMap((step) => [step.instruction, step.result]),
            );
          }
          await expect(page.locator('a[href*="/lab/"]')).toHaveCount(0);
        }
      }
      expect(errors).toEqual([]);
    });
  test("root is English Explore, and the static route inventory agrees with the sitemap", async ({
    page,
    request,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    expect((await page.goto("/"))?.status()).toBe(200);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveText("One sheet. Endless possibilities.");
    await expect(page.locator("body")).not.toContainText("Choose a language");
    await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", origin + "/en");
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(
      Array.from((await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1]),
    ).toEqual(canonicalPaths.map((path) => origin + path));
    const dirs = readdirSync("build/client", { recursive: true, encoding: "utf8" })
      .map((p) => p.replaceAll("\\", "/"))
      .filter((p) => /(^|\/)index\.html$/.test(p))
      .map((p) => ("/" + p).replace(/\/index\.html$/, "") || "/");
    expect(dirs.sort()).toEqual([...prerenderPaths].sort());
  });
  test("localized HTTP errors offer working recovery without JavaScript", async ({ page }) => {
    for (const code of localeCodes) {
      const texts = readCopy(code, "common");
      expect((await page.goto(localPath(code) + "/lessons/unpublished"))?.status()).toBe(404);
      await expect(page.locator("html")).toHaveAttribute("dir", locales[code].dir);
      await expect(page.locator("h1")).toHaveText(texts.error.title);
      await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", "noindex");
      await page.getByRole("link", { name: texts.nav.guide, exact: true }).click();
      await expect(page.locator("h1")).toHaveText(texts.guide.title);
    }
  });
});
