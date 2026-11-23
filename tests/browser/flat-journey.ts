import { expect, type Page } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { paperPixels, type Point } from "./paper-pixels";

export const diamond: Point[][] = [
  [
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [1, 0, 0],
  ],
];
type Fixture = {
  slug: string;
  title: string;
  steps: readonly { id: string; durationMs: number }[];
  sheet: { title: string; result: string };
  copy: Record<string, { title: string; result: string; instruction: string }>;
  middles: Record<number, Point[][]>;
  outline: Point[];
  probes: Point[];
  colors: string[];
};
const eye: Point = [0, -0.75, 3.4];
const button = (p: Page, name: string) => p.getByRole("button", { name, exact: true });

export function flatJourney(f: Fixture) {
  const route = "/en/lessons/" + f.slug,
    total = f.steps.length;
  const action = (n: number) => {
    const step = f.steps[n - 1];
    if (!step) throw Error("Missing step");
    return step;
  };
  const copy = (n: number) => {
    const text = f.copy[action(n).id];
    if (!text) throw Error("Missing instruction");
    return text;
  };
  test.describe(f.title, () => {
    test("pre-renders every instruction on a direct load and refresh", async ({
      browser,
      baseURL,
    }) => {
      const ctx = await browser.newContext({ baseURL, javaScriptEnabled: false });
      try {
        const page = await ctx.newPage(),
          errors = watchBrowser(page, baseURL, false);
        for (const visit of [() => page.goto(route), () => page.reload()]) {
          const response = await visit();
          expect(response?.status()).toBe(200);
          expect(await response?.text()).toContain(copy(total).instruction);
          await expect(page.getByRole("heading", { level: 1 })).toHaveText(f.title);
          await expect(page.locator("details li")).toHaveCount(total);
          await expect(button(page, "Next")).toBeDisabled();
        }
        expect(errors).toEqual([]);
      } finally {
        await ctx.close();
      }
    });

    test("paints two spatial folds, finishes the outline and reverses to the original pixels", async ({
      page,
      baseURL,
    }, info) => {
      const errors = watchBrowser(page, baseURL);
      await page.setViewportSize({ width: 1280, height: 920 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
      await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
      await page.goto(route);
      await expect(button(page, "Orbit left")).toBeEnabled();
      await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
      const canvas = page.locator("canvas");
      const capture = async (name: string) => {
        await canvas.screenshot({ path: info.outputPath(name + ".png") });
      };
      const meter = page.getByRole("meter");
      async function endpoint(n: number) {
        await expect(meter).toHaveJSProperty("value", n);
        await expect(
          page.getByRole("region", { name: "Fold instruction" }).getByRole("heading"),
        ).toHaveText(n ? copy(n).title : f.sheet.title);
        await expect(
          page.getByRole("img", { name: n ? copy(n).result : f.sheet.result, exact: true }),
        ).toBeVisible();
      }
      await endpoint(0);
      const flat = await paperPixels(page, diamond, eye),
        readings: Record<string, number> = { flat: flat.iou };
      expect(flat.iou).toBeGreaterThan(0.94);
      await capture("flat");
      for (let n = 1; n <= total; n++) {
        const duration = action(n).durationMs;
        await button(page, "Next").focus();
        await page.keyboard.press("Enter");
        const middle = f.middles[n];
        if (middle) {
          await page.clock.fastForward(duration / 2);
          await expect(meter).toHaveJSProperty("value", n - 0.5);
          const mid = await paperPixels(page, middle, eye);
          readings["mid-" + n] = mid.iou;
          expect(mid.iou).toBeGreaterThan(0.92);
          expect(mid.hash).not.toBe(flat.hash);
          await capture("mid-" + n);
          await button(page, "Previous").click();
          await page.clock.fastForward(duration / 4);
          await expect(meter).toHaveJSProperty("value", n - 0.75);
          await button(page, "Next").click();
          await page.clock.fastForward(duration / 4);
          expect((await paperPixels(page, middle, eye)).hash).toBe(mid.hash);
          await button(page, "Replay").click();
          await page.clock.fastForward(duration / 2);
          await expect(meter).toHaveJSProperty("value", n - 1);
        }
        await page.clock.fastForward(duration);
        await endpoint(n);
      }
      const final = await paperPixels(page, [f.outline], eye, f.probes);
      readings.finished = final.iou;
      expect(final.iou).toBeGreaterThan(0.94);
      expect(final.colors).toEqual(f.colors);
      await expect(page.getByRole("status")).toContainText(copy(total).result);
      await capture("finished");
      await button(page, "Orbit right").click();
      await button(page, "Tilt down").click();
      await button(page, "Zoom in").click();
      await page.clock.runFor(32);
      await endpoint(total);
      await capture("angled");
      for (let i = 0; i < 8; i++) await button(page, "Tilt down").click();
      await page.clock.runFor(32);
      await capture("back");
      await button(page, "Reset view").click();
      await page.clock.runFor(32);
      expect((await paperPixels(page, [f.outline], eye)).hash).toBe(final.hash);
      for (let n = total; n > 0; n--) {
        await button(page, "Previous").click();
        await page.clock.fastForward(action(n).durationMs);
        await endpoint(n - 1);
      }
      await capture("reversed");
      expect((await paperPixels(page, diamond, eye)).hash).toBe(flat.hash);
      expect(errors).toEqual([]);
      console.info(
        f.slug,
        info.project.name,
        "production silhouette IoU",
        JSON.stringify(readings),
      );
    });

    test("preserves all text poses without WebGL", async ({ page, baseURL }) => {
      const errors = watchBrowser(page, baseURL);
      await page.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          ...args: unknown[]
        ) {
          return type === "webgl2" ? null : Reflect.apply(get, this, [type, ...args]);
        } as typeof get;
      });
      await page.goto(route);
      await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
      for (let n = 1; n <= total; n++) {
        await button(page, "Next").click();
        await expect(page.getByRole("meter")).toHaveJSProperty("value", n);
      }
      await expect(page.locator(".lab-placeholder")).toContainText(copy(total).result);
      await button(page, "Replay").click();
      await expect(page.getByRole("status")).toContainText("Replay complete");
      for (let n = total; n > 0; n--) await button(page, "Previous").click();
      await expect(page.getByRole("meter")).toHaveJSProperty("value", 0);
      expect(errors).toEqual([]);
    });
  });
}
