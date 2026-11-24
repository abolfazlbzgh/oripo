import { expect } from "@playwright/test";
import { disableWebGL, test, watchBrowser } from "./preview";
import { finishedOutlines } from "./finished-outlines";
import { paperPixels, type Point } from "./paper-pixels";
import { localeCodes, locales } from "../../app/i18n/locales";
import { readCopy } from "./locale-copy";

for (const { id, end, mid, eye } of [
  { id: "pinwheel-calyx", end: 8, mid: 4.5, eye: [2.4, -3.9, 3.9] },
  { id: "river-tern", end: 15, mid: 11.5, eye: [3.1, 0.7, 2.6] },
  { id: "hex-iris", end: 20, mid: 18.5, eye: [1.45, -2.4, 2.55] },
  { id: "jumping-frog", end: 20, mid: 15.5, eye: [0.55, -1.15, 2.75] },
  { id: "herringbone-map", end: 15, mid: 14.5, eye: [1.6, -3.5, 3.9] },
] as const) {
  test(id + " serves every folding result when WebGL is unavailable", async ({ page, baseURL }) => {
    const errors = watchBrowser(page, baseURL);
    await disableWebGL(page);
    await page.goto("/en/lessons/" + id);
    await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
    const copy = readCopy("en", id);
    const placeholder = page.locator(".studio-placeholder");
    await expect(placeholder).toContainText(copy.sheet.result);
    for (const step of Object.values(copy.steps)) {
      await page.getByRole("button", { name: "Next fold", exact: true }).click();
      await expect(placeholder).toContainText(step.result);
    }
    await expect(page.getByRole("slider")).toHaveValue(String(end));
    await page.getByRole("button", { name: "Return to starting sheet" }).click();
    await expect(placeholder).toContainText(copy.sheet.result);
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(
    id + " keeps the localized transcript and keyboard completion usable at double text size",
    async ({ page, baseURL }) => {
      test.setTimeout(120000);
      const errors = watchBrowser(page, baseURL);
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const [i, locale] of localeCodes.entries()) {
        const width = [320, 390, 768, 1440, 667][i % 5] ?? 320,
          length = width === 667 ? 375 : 840;
        await page.setViewportSize({ width, height: length });
        const common = readCopy(locale, "common"),
          manuscript = readCopy(locale, id);
        await page.goto("/" + locale + "/lessons/" + id);
        await expect(
          page.getByRole("button", { name: common.player.closer, exact: true }),
        ).toBeEnabled();
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
        const range = page.getByRole("slider", { name: common.player.progress });
        await range.press("End");
        await expect(range).toHaveValue(String(end));
        await expect(page.locator("html")).toHaveAttribute("dir", locales[locale].dir);
        await page.getByRole("button", { name: common.player.info }).press("Enter");
        const dialog = page.getByRole("dialog"),
          close = dialog.getByRole("button", { name: common.player.close });
        await expect(close).toBeFocused();
        await expect(dialog).toContainText(
          Object.values(manuscript.steps)[end - 1]?.result ?? "missing result",
        );
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        await close.press("Escape");
        await expect(page.getByRole("button", { name: common.player.info })).toBeFocused();
      }
      expect(errors).toEqual([]);
    },
  );
  test(
    id + " shows the working fold and the finish from the front and rear on a phone",
    async ({ page, baseURL }, info) => {
      const errors = watchBrowser(page, baseURL);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
      await page.goto("/en/lessons/" + id);
      const ready = page.getByRole("button", { name: "Zoom in" }),
        range = page.getByRole("slider"),
        canvas = page.locator("canvas"),
        orbit = page.locator(".studio-canvas");
      await expect(ready).toBeEnabled();
      await range.fill(String(mid));
      await canvas.screenshot({ path: info.outputPath("working-fold.png") });
      await range.fill(String(end));
      for (const direction of [1, -1] as const) {
        await page.getByRole("button", { name: "Reset view" }).click();
        for (let i = 0; i < 12; i++) await orbit.press(direction === 1 ? "ArrowUp" : "ArrowDown");
        const radius = Math.hypot(...eye),
          az = Math.atan2(eye[1], eye[0]),
          e = (direction * Math.PI * 11) / 24;
        const camera: Point = [
          radius * Math.cos(e) * Math.cos(az),
          radius * Math.cos(e) * Math.sin(az),
          radius * Math.sin(e),
        ];
        const view = direction === 1 ? "front" : "rear";
        // The stage focus outline is painted over the canvas. Keep it outside the paper sample.
        await range.focus();
        const score = await paperPixels(page, finishedOutlines[id], camera, [], id, true);
        console.info(id, view, info.project.name, "IoU", score.iou);
        expect(score.iou).toBeGreaterThan(0.95);
        await canvas.screenshot({ path: info.outputPath(view + ".png") });
      }
      await canvas.evaluate((c) => {
        const ext = (c as HTMLCanvasElement)
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context");
        if (!ext) throw Error("No context-loss extension");
        ext.loseContext();
      });
      await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
      await expect(range).toHaveValue(String(end));
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      await expect(range).toHaveValue(String(end - 1));
      await page.reload();
      await expect(ready).toBeEnabled();
      await expect(range).toHaveValue("0");
      expect(errors).toEqual([]);
    },
  );
}
