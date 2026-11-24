import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { paperPixels, type Point } from "./paper-pixels";
import { readCopy } from "./locale-copy";
import { inspectByTouch } from "./studio-touch";
import { calyxOutline } from "../advanced-projections";
import { ternOutline } from "../tern-projection";
import { irisPolygons } from "../iris-projection";

const cases = [
  {
    id: "pinwheel-calyx",
    action: 4,
    eye: [2.4, -3.9, 3.9],
    project: (t: number) => calyxOutline(t, 0, false),
  },
  {
    id: "river-tern",
    action: 11,
    eye: [3.1, 0.7, 2.6],
    project: (t: number) => ternOutline(63 * t, 0, 0),
  },
  {
    id: "hex-iris",
    action: 18,
    eye: [1.45, -2.4, 2.55],
    project: (t: number) => irisPolygons(t).map((p) => p.posed),
  },
] as const;
for (const { id, action, eye, project } of cases) {
  test(
    id + " tracks the moving paper at three fractions in both directions",
    async ({ page, baseURL }, info) => {
      const errors = watchBrowser(page, baseURL);
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
      await page.goto("/en/lessons/" + id);
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
      const range = page.getByRole("slider"),
        canvas = page.locator("canvas");
      for (const f of [0.25, 0.5, 0.75, 0.5, 0.25]) {
        await range.fill(String(action + f));
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const score = await paperPixels(page, project(f), [...eye] as Point, [], undefined, true);
        expect(score.iou).toBeGreaterThan(0.9);
        console.info(id, info.project.name, "working", f, score.iou);
        await canvas.screenshot({ path: info.outputPath("working-" + f + ".png") });
      }
      expect(errors).toEqual([]);
    },
  );
  test(id + " recovers a missing scene chunk after text-only completion", async ({ page }) => {
    const asset = new RegExp("/assets/package-scene\\.client-[^/]+\\.js$");
    let refused = 0;
    await page.route(asset, async (route) => {
      refused++;
      await route.fulfill({
        status: 503,
        contentType: "text/plain",
        body: "Temporarily unavailable",
      });
    });
    await page.goto("/en/lessons/" + id);
    await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Show finished model" }).click();
    const steps = Object.values(readCopy("en", id).steps),
      placeholder = page.locator(".studio-placeholder");
    await expect(placeholder).toContainText(steps.at(-1)?.result ?? "Missing final result");
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    await expect(placeholder).toContainText(steps.at(-2)?.result ?? "Missing previous result");
    expect(refused).toBeGreaterThan(0);
    await page.unroute(asset);
    await page.reload();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expect(page.getByRole("slider")).toHaveValue("0");
  });
  test.describe(id + " touch", () => {
    test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
    test("@cdp orbits, pinches, reads and scrubs the advanced lesson", async ({
      page,
      context,
      baseURL,
    }) => {
      const errors = watchBrowser(page, baseURL);
      await page.goto("/en/lessons/" + id);
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
      await page.getByRole("slider").fill(String(action + 0.5));
      await inspectByTouch(page, context);
      expect(errors).toEqual([]);
    });
  });
}
