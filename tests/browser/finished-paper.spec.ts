import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { setDark } from "./shell-helpers";
import { lessons, type ModelId } from "../../app/lessons";
import { paperPixels, type Point } from "./paper-pixels";
import { finishedOutlines } from "./finished-outlines";
const studioEyes: Record<ModelId, Point> = {
  "herringbone-map": [1.6, -3.5, 3.9],
  "paper-airplane": [2.4, -3.35, 4],
  "paper-heart": [0, -0.75, 3.4],
  "fox-face": [0, -0.75, 3.4],
  "masu-box": [2.3, -3.4, 4.8],
};
const previewEyes: Record<ModelId, Point> = {
  ...studioEyes,
  "paper-heart": [0, -0.18, 1],
  "fox-face": [0, -0.18, 1],
  "masu-box": [2, -3, 3],
};

for (const { id, stepCount } of lessons)
  test(
    id + " changes stock at the exact endpoint and retraces its material",
    async ({ page, baseURL }, info) => {
      const errors = watchBrowser(page, baseURL);
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
      await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
      await page.goto("/en/lessons/" + id);
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
      await page.clock.pauseAt(new Date("2026-01-01T12:02:00Z"));
      const canvas = page.locator("canvas"),
        slider = page.getByRole("slider");
      const proof = (name: string) => canvas.screenshot({ path: info.outputPath(name + ".png") });
      const paper = () => paperPixels(page, finishedOutlines[id], studioEyes[id], [], id);
      const flat = await proof("flat");
      await slider.fill(id === "masu-box" ? "12.5" : String(stepCount - 1.5));
      await page.clock.runFor(40);
      await proof("intermediate");
      await slider.fill(String(stepCount - 0.001));
      await page.clock.runFor(40);
      const teaching = await paper();
      await slider.fill(String(stepCount));
      await page.clock.runFor(40);
      const finished = await paper();
      expect(finished.iou).toBeGreaterThan(0.9);
      expect(teaching.colored).toBeLessThan(finished.colored * 0.08);
      await proof("finished-light");
      await setDark(page, true);
      await page.clock.runFor(40);
      expect((await paper()).iou).toBeGreaterThan(0.9);
      await proof("finished-dark");
      await page.locator(".studio-canvas").press("ArrowRight");
      await page.clock.runFor(40);
      await proof("finished-angled");
      await page.getByRole("button", { name: "Reset view" }).click();
      await page.getByRole("button", { name: "Previous", exact: true }).click();
      await page.clock.runFor(160);
      expect((await paper()).colored).toBeLessThan(finished.colored * 0.08);
      await page.getByRole("button", { name: "Pause playback" }).click();
      await page.getByRole("button", { name: "Play all folds" }).click();
      await page.clock.fastForward(10000);
      await expect(slider).toHaveValue(String(stepCount));
      expect((await paper()).iou).toBeGreaterThan(0.9);
      await page.getByRole("button", { name: "Replay all folds" }).click();
      await page.clock.runFor(80);
      expect((await paper()).colored).toBeLessThan(finished.colored * 0.08);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "Show finished model" }).click();
      await page.clock.runFor(40);
      expect((await paper()).iou).toBeGreaterThan(0.9);
      await setDark(page, false);
      for (let i = stepCount; i > 0; i--)
        await page.getByRole("button", { name: "Previous", exact: true }).click();
      await page.clock.runFor(40);
      await expect(slider).toHaveValue("0");
      expect((await proof("fully-reversed")).equals(flat)).toBe(true);
      expect(errors).toEqual([]);
      console.log(
        id,
        info.project.name,
        "finish IoU",
        finished.iou,
        "teaching/finished hue pixels",
        teaching.colored,
        finished.colored,
      );
    },
  );

test("gallery previews retain the independently constructed silhouettes at phone width and double text", async ({
  page,
  baseURL,
}, info) => {
  const errors = watchBrowser(page, baseURL),
    scripts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") scripts.push(r.url());
  });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/en#models");
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  for (const dark of [false, true]) {
    await setDark(page, dark);
    for (const { id, finishedAppearance } of lessons) {
      const img = page.locator(`img[src="/previews/${id}.png"]`);
      await img.scrollIntoViewIfNeeded();
      const score = await img.evaluate(
        async (el, { polygons, eye, palette }) => {
          const image = el as HTMLImageElement;
          await image.decode();
          const cv = document.createElement("canvas"),
            w = (cv.width = image.naturalWidth),
            h = (cv.height = image.naturalHeight);
          const ctx = cv.getContext("2d");
          if (!ctx) throw Error("Missing preview raster context");
          ctx.drawImage(image, 0, 0);
          const actual = new DataView(ctx.getImageData(0, 0, w, h).data.buffer);
          ctx.clearRect(0, 0, w, h);
          const [ex, ey, ez] = eye,
            ground = Math.hypot(ex, ey),
            distance = Math.hypot(ground, ez);
          const xy = polygons.map((face) =>
            face.map(
              ([x, y, z]) =>
                [
                  (-ey * x + ex * y) / ground,
                  (((ex * x + ey * y) * ez) / ground - ground * z) / distance,
                ] as const,
            ),
          );
          const xs = xy.flat().map((p) => p[0]),
            ys = xy.flat().map((p) => p[1]),
            minX = Math.min(...xs),
            minY = Math.min(...ys),
            dx = Math.max(...xs) - minX,
            dy = Math.max(...ys) - minY;
          const k = 0.91 * Math.min(w / dx, h / dy);
          for (const f of xy) {
            ctx.beginPath();
            f.forEach(([x, y], i) =>
              ctx[i ? "lineTo" : "moveTo"](
                w / 2 + (x - minX - dx / 2) * k,
                h / 2 + (y - minY - dy / 2) * k,
              ),
            );
            ctx.closePath();
            ctx.fill();
          }
          const mask = new DataView(ctx.getImageData(0, 0, w, h).data.buffer);
          let both = 0,
            union = 0,
            fills = 0,
            paper = 0;
          const hues = [palette.front, palette.reverse].map((c) =>
            [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)),
          );
          for (let i = 0; i < actual.byteLength; i += 4) {
            const a = actual.getUint8(i + 3) > 127,
              b = mask.getUint8(i + 3) > 127;
            if (a || b) union++;
            if (a && b) both++;
            if (a) {
              paper++;
              if (
                hues.some(([r, g, b]) => {
                  if (r === undefined || g === undefined || b === undefined)
                    throw Error("Missing color channel");
                  const k = actual.getUint8(i) / r;
                  return (
                    k > 0.75 &&
                    k < 1.02 &&
                    Math.abs(actual.getUint8(i + 1) - k * g) < 2 &&
                    Math.abs(actual.getUint8(i + 2) - k * b) < 2
                  );
                })
              )
                fills++;
            }
          }
          return { iou: both / union, palette: fills / paper };
        },
        { polygons: finishedOutlines[id], eye: previewEyes[id], palette: finishedAppearance },
      );
      expect(score.iou, id).toBeGreaterThan(0.96);
      expect(score.palette, id).toBeGreaterThan(0.85);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator(".library")
      .screenshot({ path: info.outputPath(dark ? "gallery-dark.png" : "gallery-light.png") });
  }
  expect(scripts.filter((s) => s.includes(".client-") && !s.includes("/entry.client-"))).toEqual(
    [],
  );
  expect(errors).toEqual([]);
});
