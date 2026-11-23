import { hydrationControl, setDark } from "./shell-helpers";
import { inspectByTouch } from "./studio-touch";
import { expect, type Page } from "@playwright/test";
import { disableWebGL, test, watchBrowser } from "./preview";
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
  slug: "paper-heart" | "fox-face";
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
          await button(page, "Read step instructions").click();
          const transcript = page.locator("details");
          await transcript.locator("summary").focus();
          if (!(await transcript.evaluate((element) => element.hasAttribute("open"))))
            await page.keyboard.press("Enter");
          for (let n = 1; n <= total; n++) {
            const step = transcript.getByRole("listitem").nth(n - 1);
            await expect(step.getByText(copy(n).instruction, { exact: true })).toBeVisible();
            await expect(step.getByText(copy(n).result, { exact: true })).toBeVisible();
          }
          await expect(button(page, "Next fold")).toBeDisabled();
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
      const scenes: string[] = [];
      page.on("request", (r) => {
        if (/\/(?:studio|(?:[\w-]+-)?scene)\.client-/.test(r.url())) scenes.push(r.url());
      });
      await page.goto("/en");
      await expect(hydrationControl(page)).toBeEnabled();
      const card = page
        .getByRole("article")
        .filter({ has: page.getByRole("link", { name: f.title, exact: true }) });
      await expect(card.getByText("Playable lesson")).toBeVisible();
      await expect(card.getByText(`Beginner · ${total} steps · Square sheet`)).toBeVisible();
      expect(scenes).toEqual([]);
      await card.getByRole("link").focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(route + "$"));
      await expect(page.getByRole("main")).toBeFocused();
      await expect(button(page, "Zoom in")).toBeEnabled();
      expect(scenes.length).toBeGreaterThan(0);
      await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
      const canvas = page.locator("canvas");
      const capture = async (name: string) => {
        await canvas.screenshot({ path: info.outputPath(name + ".png") });
      };
      const progress = page.getByRole("slider");
      async function endpoint(n: number) {
        await expect(progress).toHaveJSProperty("valueAsNumber", n);
        await expect(page.locator(".instruction-body h2")).toHaveText(
          copy(Math.min(n + 1, total)).title,
        );
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
        await button(page, "Next fold").focus();
        await page.keyboard.press("Enter");
        await expect(button(page, "Next fold")).toBeFocused();
        const middle = f.middles[n];
        if (middle) {
          await page.clock.fastForward(duration / 2);
          await expect(progress).toHaveJSProperty("valueAsNumber", n - 0.5);
          const mid = await paperPixels(page, middle, eye);
          readings["mid-" + n] = mid.iou;
          expect(mid.iou).toBeGreaterThan(0.92);
          expect(mid.hash).not.toBe(flat.hash);
          await capture("mid-" + n);
          await button(page, "Previous").click();
          await page.clock.fastForward(duration / 4);
          await expect(progress).toHaveJSProperty("valueAsNumber", n - 0.75);
          await button(page, "Next fold").click();
          await page.clock.fastForward(duration / 4);
          expect((await paperPixels(page, middle, eye)).hash).toBe(mid.hash);
          await progress.fill(String(n - 1));
          await page.clock.fastForward(duration / 2);
          await expect(progress).toHaveJSProperty("valueAsNumber", n - 1);
          await progress.fill(String(n - 0.5));
          await page.clock.runFor(32);
          expect((await paperPixels(page, middle, eye)).hash).toBe(mid.hash);
          await button(page, "Next fold").click();
        }
        await page.clock.fastForward(duration);
        await endpoint(n);
      }
      const final = await paperPixels(page, [f.outline], eye, f.probes, f.slug);
      readings.finished = final.iou;
      expect(final.iou).toBeGreaterThan(0.94);
      expect(final.colors).toEqual(f.colors);
      await expect(page.getByRole("status")).toContainText(copy(total).result);
      await capture("finished");
      await page.locator(".studio-canvas").press("ArrowRight");
      await page.locator(".studio-canvas").press("ArrowDown");
      await button(page, "Zoom in").click();
      await page.clock.runFor(32);
      await endpoint(total);
      await capture("angled");
      for (let i = 0; i < 8; i++) await page.locator(".studio-canvas").press("ArrowDown");
      await page.clock.runFor(32);
      await capture("back");
      await button(page, "Reset view").click();
      await page.clock.runFor(32);
      expect((await paperPixels(page, [f.outline], eye, [], f.slug)).hash).toBe(final.hash);
      for (let n = total; n > 0; n--) {
        await button(page, "Previous").click();
        await page.clock.fastForward(action(n).durationMs);
        await endpoint(n - 1);
      }
      await capture("reversed");
      expect((await paperPixels(page, diamond, eye)).hash).toBe(flat.hash);
      await page.getByRole("banner").getByRole("link", { name: "Oripo", exact: true }).click();
      await expect(page.getByRole("heading", { name: "On the worktable" })).toBeVisible();
      expect(errors).toEqual([]);
      console.info(
        f.slug,
        info.project.name,
        "production silhouette IoU",
        JSON.stringify(readings),
      );
    });

    for (const width of [320, 390]) {
      test(`reduced-motion playback and themes survive refresh at ${width}px`, async ({
        page,
        baseURL,
      }) => {
        const errors = watchBrowser(page, baseURL);
        await page.setViewportSize({ width, height: 844 });
        await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
        expect((await page.goto(route))?.status()).toBe(200);
        await expect(button(page, "Zoom in")).toBeEnabled();
        await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
        await setDark(page, false);
        expect((await page.reload())?.status()).toBe(200);
        await expect(button(page, "Zoom in")).toBeEnabled();
        await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
        await setDark(page, true);
        for (let n = 1; n <= total; n++) {
          await button(page, "Next fold").click();
          await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", n);
        }
        const final = await paperPixels(page, [f.outline], eye, [], f.slug);
        expect(final.iou).toBeGreaterThan(0.86);
        await button(page, "Return to starting sheet").press("Space");
        await expect(button(page, "Show finished model")).toBeFocused();
        await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", 0);
        await button(page, "Show finished model").press("Space");
        await expect(page.getByRole("status")).toContainText(copy(total).result);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await button(page, "Previous").click();
        await page.locator("canvas").evaluate((c) => {
          const loss = (c as HTMLCanvasElement)
            .getContext("webgl2")
            ?.getExtension("WEBGL_lose_context");
          if (!loss) throw Error("Context loss extension unavailable");
          loss.loseContext();
        });
        await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
        await expect(page.locator("canvas")).toHaveCount(0);
        await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", total - 1);
        await button(page, "Next fold").click();
        await expect(page.getByRole("status")).toContainText(copy(total).result);
        expect(errors).toEqual([]);
      });
    }

    test.describe("touch workbench", { tag: "@cdp" }, () => {
      test.use({ hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
      test("one-finger orbit, pinch and a swipe outside the canvas preserve the fold", async ({
        page,
        context,
        baseURL,
      }) => {
        const errors = watchBrowser(page, baseURL);
        await page.goto(route);
        await expect(button(page, "Zoom in")).toBeEnabled();
        await button(page, "Next fold").tap();
        await inspectByTouch(page, context);
        await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", 1);
        await expect(page.getByRole("status")).toContainText(copy(1).result);
        expect(errors).toEqual([]);
      });
    });

    test("preserves all text poses without WebGL", async ({ page, baseURL }) => {
      const errors = watchBrowser(page, baseURL);
      await disableWebGL(page);
      await page.goto(route);
      await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
      for (let n = 1; n <= total; n++) {
        await button(page, "Next fold").click();
        await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", n);
      }
      await expect(page.locator(".studio-placeholder")).toContainText(copy(total).result);
      await button(page, "Return to starting sheet").click();
      await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", 0);
      await button(page, "Show finished model").click();
      await expect(page.getByRole("status")).toContainText(copy(total).result);
      for (let n = total; n > 0; n--) await button(page, "Previous").click();
      await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", 0);
      expect(errors).toEqual([]);
    });
  });
}
