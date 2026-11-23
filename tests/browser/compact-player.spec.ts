import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";

for (const [slug, first, second, total] of [
  ["paper-airplane", 1600, 1600, 9],
  ["paper-heart", 1400, 1400, 12],
  ["fox-face", 1500, 1400, 6],
] as const) {
  test(`${slug} plays through a boundary, pauses mid-fold and cancels the clock on seek`, async ({
    page,
    baseURL,
  }) => {
    const errors = watchBrowser(page, baseURL);
    await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
    await page.goto("/en/lessons/" + slug);
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
    const range = page.getByRole("slider", { name: "Lesson progress" });
    const play = page.getByRole("button", { name: "Play all folds" });
    await expect(
      page.getByRole("region", { name: "Lesson playback" }).getByRole("button"),
    ).toHaveCount(3);
    await range.fill("0.5");
    await page.clock.fastForward(4000);
    await expect(range).toHaveValue("0.5");
    await play.press("Space");
    await page.clock.fastForward((first + second) / 2);
    await expect(range).toHaveJSProperty("valueAsNumber", 1.5);
    await page.getByRole("button", { name: "Pause playback" }).press("Enter");
    await page.clock.fastForward(50000);
    await expect(range).toHaveValue("1.5");
    await play.press("Space");
    await page.clock.fastForward(second / 4);
    await expect(range).toHaveValue("1.75");
    await range.fill("0.375");
    await page.clock.fastForward(50000);
    await expect(range).toHaveValue("0.375");
    await expect(play).toBeVisible();
    await range.press("ArrowRight");
    await expect(range).toHaveValue("0.425");
    await expect(range).toHaveAttribute("aria-valuetext", /Step 1 of .*43% folded/);
    await range.press("PageUp");
    await expect(range).toHaveValue("1");
    await range.press("PageDown");
    await expect(range).toHaveValue("0");
    await range.press("End");
    await expect(range).toHaveValue(String(total));
    await expect(page.getByRole("button", { name: "Next fold" })).toBeDisabled();
    await page.getByRole("button", { name: "Replay all folds" }).press("Space");
    await page.clock.fastForward(first / 2);
    await expect(range).toHaveValue("0.5");
    await range.press("Home");
    await expect(range).toHaveValue("0");
    expect(errors).toEqual([]);
  });
}

test("Info holds the displayed fold, makes the background inert and returns keyboard focus", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.goto("/en/lessons/paper-heart");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  const info = page.getByRole("button", { name: "Read step instructions" });
  const dialog = page.getByRole("dialog");
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [667, 375],
  ] as const) {
    await page.setViewportSize({ width, height });
    const range = page.getByRole("slider");
    await range.fill("5.375");
    await page.getByRole("button", { name: "Play all folds" }).press("Space");
    await info.press("Enter");
    const held = await page.locator(".lesson-range").inputValue();
    await expect(dialog.getByRole("heading", { name: "Raise the bottom point" })).toBeVisible();
    const close = dialog.getByRole("button", { name: "Close instructions" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("region", { name: "Instruction text" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.locator("summary")).toBeFocused();
    if (!(await dialog.locator("details").evaluate((el) => el.hasAttribute("open"))))
      await page.keyboard.press("Enter");
    await expect(dialog.getByRole("listitem")).toHaveCount(12);
    await page
      .locator(".wordmark")
      .first()
      .evaluate((el) => (el as HTMLElement).focus());
    await expect(dialog.locator("summary")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(info).toBeFocused();
    await expect(range).toHaveValue(held);
    await info.press("Space");
    await close.press("Enter");
    await expect(info).toBeFocused();
    await info.click();
    await page.mouse.click(2, 2);
    await expect(info).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("dragging and releasing the timeline during motion leaves one paused pose", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
  await page.goto("/en/lessons/fox-face");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
  await page.getByRole("button", { name: "Play all folds" }).click();
  await page.clock.fastForward(650);
  const range = page.getByRole("slider");
  const box = await range.boundingBox();
  if (!box) throw Error("Missing timeline");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.73, y, { steps: 8 });
  const held = Number(await range.inputValue());
  expect(held).toBeGreaterThan(4);
  expect(held).toBeLessThan(4.7);
  await page.mouse.up();
  await page.clock.fastForward(10000);
  await expect(range).toHaveJSProperty("valueAsNumber", held);
  await expect(page.getByRole("button", { name: "Play all folds" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("switching models retires continuous playback and a lost context stays in text mode until re-entry", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.goto("/en/lessons/fox-face");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await page.getByRole("slider").fill("3.25");
  await page.getByRole("button", { name: "Play all folds" }).click();
  const old = await page
    .locator("canvas")
    .evaluateHandle((el) => (el as HTMLCanvasElement).getContext("webgl2"));
  await page.getByRole("button", { name: "Choose model, Fox face" }).press("Enter");
  await page.getByRole("link", { name: "Paper heart", exact: true }).press("Enter");
  await expect(page.getByRole("heading", { name: "Paper heart", level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await expect(page.getByRole("slider")).toHaveValue("0");
  await expect.poll(() => old.evaluate((gl) => gl?.isContextLost())).toBe(true);
  await old.dispose();
  await page.getByRole("slider").fill("2.5");
  await page.getByRole("button", { name: "Play all folds" }).click();
  const retired = await page.locator("canvas").elementHandle();
  if (!retired) throw Error("Missing active canvas");
  await retired.evaluate((el) => {
    const extension = (el as HTMLCanvasElement)
      .getContext("webgl2")
      ?.getExtension("WEBGL_lose_context");
    if (!extension) throw Error("Missing context loss extension");
    extension.loseContext();
  });
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  const held = Number(await page.getByRole("slider").inputValue());
  expect(held).toBeGreaterThanOrEqual(2.5);
  expect(held).toBeLessThan(3);
  await retired.evaluate((el) => el.dispatchEvent(new Event("webglcontextrestored")));
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("2");
  await retired.dispose();
  await page.reload();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await expect(page.getByRole("slider")).toHaveValue("0");
  expect(errors).toEqual([]);
});

test("the stage leaves paper clear of the rail and transport at seven viewport sizes and doubled text", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.goto("/en/lessons/paper-airplane");
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  for (const [width, height] of [
    [320, 568],
    [360, 800],
    [390, 844],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [667, 375],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const size of ["100%", "200%"]) {
      const boxes = await page.evaluate((size) => {
        document.documentElement.style.fontSize = size;
        const rect = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw Error("Missing " + selector);
          return element.getBoundingClientRect();
        };
        const stage = rect(".lesson-studio"),
          canvas = rect(".studio-canvas"),
          rail = rect(".studio-camera"),
          bar = rect(".lesson-transport");
        return {
          width: document.documentElement.scrollWidth,
          stageBottom: stage.bottom,
          paperRight: canvas.right,
          railLeft: rail.left,
          paperBottom: canvas.bottom,
          barTop: bar.top,
          controlsInside: bar.bottom <= stage.bottom,
          canvasHeight: canvas.height,
        };
      }, size);
      expect(boxes.width).toBe(width);
      expect(boxes.controlsInside).toBe(true);
      expect(boxes.paperRight).toBeLessThanOrEqual(boxes.railLeft + 1);
      expect(boxes.paperBottom).toBeLessThanOrEqual(boxes.barTop + 1);
      expect(boxes.canvasHeight).toBeGreaterThan(75);
      expect(boxes.stageBottom).toBeLessThanOrEqual(height);
    }
  }
  expect(errors).toEqual([]);
});
