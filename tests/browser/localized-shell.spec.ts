import { expect, type Page } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { readCopy } from "./locale-copy";
import { hydrationControl } from "./shell-helpers";
import { locales, localeCodes, type Locale } from "../../app/i18n/locales";
import { galleryPath, localPath } from "../../app/navigation";

test("Arabic fold numbers match the prerendered document through hydration and reload", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  const copy = readCopy("ar", "common");
  for (const visit of [() => page.goto("/ar/lessons/twin-stern-junk"), () => page.reload()]) {
    const response = await visit();
    expect(response?.status()).toBe(200);
    const initial = await page.evaluate(
      (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return {
          counter: doc.querySelector(".transport-caption span")?.textContent,
          step: doc.querySelector(".step-indicator")?.textContent,
        };
      },
      (await response?.text()) ?? "",
    );
    expect(initial.counter).toBe("0 / 27");
    await expect(page.getByRole("button", { name: copy.player.closer, exact: true })).toBeEnabled();
    const counter = page.locator(".transport-caption span");
    await expect(counter).toHaveText("0 / 27");
    expect(await page.locator(".step-indicator").textContent()).toBe(initial.step);
    await page.getByRole("slider").fill("1");
    await expect(counter).toHaveText("1 / 27");
    expect(errors).toEqual([]);
  }
});

async function atGallery(page: Page, code: Locale) {
  await expect(page).toHaveURL(new RegExp("/" + code + "#models$"));
  const gallery = page.locator("#models");
  await expect(gallery).toBeFocused();
  await expect
    .poll(() =>
      gallery.evaluate((el) =>
        Math.round(
          el.getBoundingClientRect().top -
            (document.querySelector("header.masthead")?.getBoundingClientRect().bottom ?? 0),
        ),
      ),
    )
    .toBeCloseTo(13, -1);
}
async function openNav(page: Page, code: Locale) {
  const menu = page.getByRole("button", { name: readCopy(code, "common").nav.menu });
  if (await menu.isVisible()) await menu.click();
  return page.getByRole("banner");
}
test("brand, repeated Explore, footer, reload and browser history reach their intended positions", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.emulateMedia({ reducedMotion: "reduce" });
  test.setTimeout(90000);
  const code = "fr",
    copy = readCopy(code, "common");
  const banner = page.getByRole("banner");
  const explore = banner.getByRole("link", { name: copy.nav.explore, exact: true });
  const brand = banner.getByRole("link", { name: "Oripo" });
  await page.goto(galleryPath(code));
  await atGallery(page, code);
  await page.reload();
  await atGallery(page, code);
  await brand.click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.evaluate(() => scrollTo(0, 300));
  await brand.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await explore.press("Enter");
  await atGallery(page, code);
  await page.evaluate(() => scrollTo(0, 0));
  await explore.click();
  await atGallery(page, code);
  await banner.getByRole("link", { name: copy.nav.guide, exact: true }).click();
  await expect(page.locator("main h1")).toHaveText(copy.guide.title);
  await page.getByRole("contentinfo").getByRole("link", { name: copy.nav.explore }).click();
  await atGallery(page, code);
  await page.goBack();
  await expect(page).toHaveURL(/\/fr\/guide\/crease-notation$/);
  await expect(page.locator("main h1")).toHaveText(copy.guide.title);
  await page.goForward();
  await atGallery(page, code);
  for (const [slug, model] of Object.entries(copy.models)) {
    await page.locator(".library").getByRole("link", { name: model.title, exact: true }).click();
    await expect(page).toHaveURL(new RegExp("/fr/lessons/" + slug + "$"));
    await expect(page.locator(".studio-camera")).toBeEnabled();
    await explore.click();
    await atGallery(page, code);
  }
  await page.getByRole("contentinfo").getByRole("link", { name: "Oripo" }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(errors).toEqual([]);
});

test("switching locale in a paused fold preserves fractional progress and the live camera", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.goto("/en/lessons/fox-face");
  await expect(page.locator(".studio-camera")).toBeEnabled();
  const range = page.getByRole("slider");
  await range.fill("1.05");
  await expect(range).toHaveValue("1.05");
  await page.locator(".studio-canvas").press("ArrowRight");
  const cameraBefore = await page.locator(".lab-reading").textContent();
  const canvas = await page.locator("canvas").elementHandle();
  if (!canvas) throw Error("Missing canvas");
  let current: Locale = "en";
  for (const code of [...localeCodes.filter((c) => c !== "en"), "en"] as Locale[]) {
    const control = page.getByRole("button", {
      name: readCopy(current, "common").nav.language,
      exact: true,
    });
    await control.press("ArrowDown");
    const menu = page.locator("#languages");
    await expect(menu.getByRole("link")).toHaveCount(10);
    await menu.locator(`a[hreflang="${code}"]`).press("Enter");
    const copy = readCopy(code, "common");
    await expect(page).toHaveURL(new RegExp(localPath(code, "fox-face") + "$"));
    await expect(page.locator("html")).toHaveAttribute("lang", code);
    await expect(range).toHaveValue("1.05");
    await expect(
      page.getByRole("heading", { name: copy.models["fox-face"].title, level: 1 }),
    ).toBeAttached();
    await expect(range).toHaveAccessibleName(copy.player.progress);
    expect(
      await canvas.evaluate((el) => el.isConnected && el === document.querySelector("canvas")),
    ).toBe(true);
    current = code;
  }
  expect(await page.locator(".lab-reading").textContent()).toBe(cameraBefore);
  await page.goto("/ar/lessons/fox-face");
  await page
    .getByRole("button", {
      name: readCopy("ar", "common").nav.choose.replace(
        "{model}",
        readCopy("ar", "common").models["fox-face"].title,
      ),
    })
    .click();
  await page.locator('#model-links a[href="/ar/lessons/paper-heart"]').click();
  await expect(page).toHaveURL(/\/ar\/lessons\/paper-heart$/);
  await expect(range).toHaveValue("0");
  expect(errors).toEqual([]);
});

test("mobile menu supports keyboard dismissal, touch-sized targets and same-page language links", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.setViewportSize({ width: 320, height: 568 });
  const code = "fa",
    copy = readCopy(code, "common");
  await page.goto("/fa#models");
  await atGallery(page, code);
  const trigger = page.getByRole("button", { name: copy.nav.menu });
  await trigger.press("ArrowDown");
  const panel = page.locator("#site-menu");
  await expect(panel.getByRole("link", { name: copy.nav.explore })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(panel.getByRole("link", { name: copy.nav.guide })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
  await trigger.press("Enter");
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.locator(".wordmark").first().click();
  await expect(panel).toBeHidden();
  await trigger.click();
  await panel.getByRole("link", { name: copy.nav.explore }).click();
  await atGallery(page, code);
  await trigger.press("Enter");
  const lang = panel.getByRole("button", { name: copy.nav.language });
  await lang.press("ArrowDown");
  await expect(page.locator("#mobile-languages a[hreflang=en]")).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.locator("#mobile-languages a[hreflang=hi]")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(lang).toBeFocused();
  await lang.press("Enter");
  await page.locator("#mobile-languages a[hreflang=ja]").click();
  await atGallery(page, "ja");
  await (
    await openNav(page, "ja")
  )
    .getByRole("link", { name: readCopy("ja", "common").nav.guide, exact: true })
    .click();
  await expect(page).toHaveURL(/\/ja\/guide\/crease-notation$/);
  expect(errors).toEqual([]);
});

test("document script, one-row header, focus and scene isolation across seven viewports", async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(90000);
  const requests: string[] = [];
  const widths = [
    [320, 568],
    [360, 800],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [667, 375],
  ];
  const codes: Locale[] = ["en", "fa", "ar", "fr", "zh-Hans", "ja", "hi"];
  for (const [i, code] of codes.entries()) {
    const [width = 320, height = 568] = widths[i] ?? [];
    const page = await browser.newPage({ baseURL, viewport: { width, height } });
    const errors = watchBrowser(page, baseURL);
    page.on("request", (r) => requests.push(new URL(r.url()).pathname));
    try {
      const font = {
        latin: "inter-latin",
        fa: "vazirmatn-fa",
        ar: "noto-arabic",
        zh: "noto-sc",
        ja: "noto-jp",
        hi: "noto-devanagari",
      }[locales[code].font];
      await page.goto(localPath(code));
      await expect(hydrationControl(page)).toBeEnabled();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(() =>
          performance
            .getEntriesByType("resource")
            .map((r) => new URL(r.name).pathname)
            .filter((p) => p.endsWith(".woff2")),
        ),
      ).toEqual(["/fonts/" + font + ".woff2"]);
      for (const scheme of ["light", "dark"] as const) {
        await page.evaluate((dark) => window.oripoAppearance?.(dark), scheme === "dark");
        await expect(page.locator("html")).toHaveCSS("color-scheme", scheme);
        for (const size of ["100%", "200%"]) {
          const layout = await page.evaluate((size) => {
            document.documentElement.style.fontSize = size;
            const box = (sel: string) => {
              const el = document.querySelector(sel);
              if (!el) throw Error(sel);
              return el.getBoundingClientRect();
            };
            const h = box(".masthead"),
              brand = box(".masthead .wordmark"),
              nav = box(".wide-nav"),
              tools = box(".header-tools");
            return {
              width: document.documentElement.scrollWidth,
              row: h.height,
              above: brand.top >= h.top && tools.top >= h.top,
              inside: Math.max(brand.bottom, tools.bottom) <= h.bottom,
              gap: nav.width
                ? Math.min(nav.left - brand.right, tools.left - nav.right)
                : tools.left - brand.right,
              centered: nav.width ? Math.abs((nav.right + nav.left) / 2 - innerWidth / 2) : 0,
            };
          }, size);
          expect(layout.width).toBe(width);
          expect(layout.row).toBeLessThanOrEqual(87);
          expect(layout.inside && layout.above).toBe(true);
          expect(layout.gap).toBeGreaterThanOrEqual(-1);
          expect(layout.centered).toBeLessThan(2);
        }
      }
      await page.goto(localPath(code, "creaseGuide"));
      await expect(hydrationControl(page)).toBeEnabled();
      expect(errors).toEqual([]);
    } finally {
      await page.close();
    }
  }
  expect(requests.filter((p) => /\/(?:studio|(?:[\w-]+-)?scene)\.client-/.test(p))).toEqual([]);
});

test("a locale switch during Play all keeps the existing fold clock", async ({ page, baseURL }) => {
  const errors = watchBrowser(page, baseURL);
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/lessons/paper-airplane");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await page.clock.pauseAt(new Date("2026-01-01T12:01:00Z"));
  await page.getByRole("button", { name: "Play all folds" }).press("Enter");
  await page.clock.fastForward(800);
  const range = page.getByRole("slider");
  await expect(range).toHaveValue("0.5");
  await page.getByRole("button", { name: "Change language" }).press("Enter");
  await page.locator('#languages a[hreflang="de"]').press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(range).toHaveValue("0.5");
  const pause = page.getByRole("button", { name: readCopy("de", "common").player.pause });
  await expect(pause).toBeEnabled();
  await page.clock.fastForward(800);
  await expect(range).toHaveValue("1");
  await pause.press("Enter");
  await page.clock.fastForward(2000);
  await expect(range).toHaveValue("1");
  expect(errors).toEqual([]);
});
