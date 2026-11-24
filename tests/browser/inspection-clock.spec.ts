import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";

test("a held drag crosses the next cue without a camera correction and the idle studio stops drawing", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  // Count real WebGL draws while forwarding the original call unchanged.
  await page.addInitScript(() => {
    const original = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      const canvas = this.canvas;
      if (canvas instanceof HTMLCanvasElement)
        canvas.dataset.draws = String(Number(canvas.dataset.draws ?? 0) + 1);
      return original.apply(this, args);
    };
  });
  await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
  await page.goto("/en/lessons/reed-runner-dinosaur");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
  const slider = page.getByRole("slider"),
    canvas = page.locator("canvas"),
    reading = page.locator(".lab-reading");
  const box = await canvas.boundingBox();
  if (!box) throw Error("No paper canvas");
  await slider.fill(".97");
  await page.getByRole("button", { name: "Play all folds" }).click();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 15);
  const manual = await reading.innerText();
  await page.clock.fastForward(250);
  expect(Number(await slider.inputValue())).toBeGreaterThan(1);
  await expect(reading).toHaveText(manual);
  await page.mouse.up();
  await page.clock.fastForward(100);
  await expect(reading).toHaveText(manual);
  await page.getByRole("button", { name: "Pause playback" }).click();
  const held = await slider.inputValue();
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(reading).not.toHaveText(manual);
  await expect(slider).toHaveValue(held);
  await page.clock.runFor(64);
  const draws = Number(await canvas.getAttribute("data-draws"));
  expect(draws).toBeGreaterThan(0);
  await page.clock.runFor(200);
  expect(Number(await canvas.getAttribute("data-draws"))).toBe(draws);
  expect(errors).toEqual([]);
});
test("pause and interrupt the final camera interval with the native paper held at completion", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
  await page.goto("/en/lessons/reed-runner-dinosaur");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
  const slider = page.getByRole("slider"),
    reading = page.locator(".lab-reading");
  await slider.fill("12.99");
  await page.getByRole("button", { name: "Next fold" }).click();
  await page.clock.fastForward(170);
  await expect(slider).toHaveValue("13");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const held = await reading.innerText();
  await page.clock.fastForward(4000);
  await expect(reading).toHaveText(held);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await page.clock.fastForward(180);
  await expect(slider).toHaveValue("13");
  await expect(reading).not.toHaveText(held);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.runFor(32);
  await expect(slider).toHaveValue("12");
  await slider.press("Home");
  await page.clock.runFor(32);
  const start = await reading.innerText();
  await page.clock.fastForward(9000);
  await expect(slider).toHaveValue("0");
  await expect(reading).toHaveText(start);
});
