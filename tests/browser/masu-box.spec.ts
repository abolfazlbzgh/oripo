import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";
import { paperPixels, type Point } from "./paper-pixels";
import { finishedOutlines } from "./finished-outlines";

const eye: Point = [2.3, -3.4, 4.8];
// Independent outline after the left and right tips were blintzed. Rotate
// the outside strips through 135 degrees to predict the half-raised walls.
function channelAt135(): Point[][] {
  const floor: Point[] = [
    [0, -2, 0],
    [0.5, -1.5, 0],
    [0.5, 1.5, 0],
    [0, 2, 0],
    [-0.5, 1.5, 0],
    [-0.5, -1.5, 0],
  ];
  const result = [floor];
  for (const s of [-1, 1]) {
    const rim = s * (0.5 - 0.5 * Math.SQRT1_2),
      z = 0.5 * Math.SQRT1_2;
    result.push([
      [s * 0.5, -1.5, 0],
      [rim, -1, z],
      [rim, 1, z],
      [s * 0.5, 1.5, 0],
    ]);
  }
  return result;
}
test("Masu wall landmarks survive a seek, context loss at completion and a fresh mount on a small screen", async ({
  page,
  baseURL,
}, info) => {
  const errors = watchBrowser(page, baseURL);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/en/lessons/masu-box");
  const ready = page.getByRole("button", { name: "Zoom in" }),
    range = page.getByRole("slider");
  await expect(ready).toBeEnabled();
  for (const size of [
    { width: 320, height: 568 },
    { width: 667, height: 375 },
  ]) {
    await page.setViewportSize(size);
    await range.fill("11.5");
    await page
      .locator("canvas")
      .screenshot({ path: info.outputPath("half-raised-" + size.width + ".png") });
    const mid = await paperPixels(page, channelAt135(), eye, [], undefined, true);
    console.info(size.width, "half-raised wall IoU", mid.iou);
    expect(mid.iou).toBeGreaterThan(0.9);
    await range.fill("18");
    const done = await paperPixels(page, finishedOutlines["masu-box"], eye, [], "masu-box");
    expect(done.iou).toBeGreaterThan(0.88);
    await page
      .locator("canvas")
      .screenshot({ path: info.outputPath("masu-" + size.width + ".png") });
  }
  await page.locator("canvas").evaluate((c) => {
    const ext = (c as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!ext) throw Error("Missing loss extension");
    ext.loseContext();
  });
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  await expect(range).toHaveValue("18");
  await page.reload();
  await expect(ready).toBeEnabled();
  await expect(range).toHaveValue("0");
  const sheet: Point[][] = [
    [
      [0, 2, 0],
      [-2, 0, 0],
      [0, -2, 0],
      [2, 0, 0],
    ],
  ];
  const fresh = await paperPixels(page, sheet, eye);
  expect(fresh.iou).toBeGreaterThan(0.9);
  expect(fresh.green).toBeGreaterThan(1000);
  await range.fill("18");
  expect(
    (await paperPixels(page, finishedOutlines["masu-box"], eye, [], "masu-box")).iou,
  ).toBeGreaterThan(0.88);
  expect(errors).toEqual([]);
});
