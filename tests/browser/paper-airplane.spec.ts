import { inspectByTouch } from "./studio-touch";
import { atIndex } from "../../app/lesson/geometry";
import { expect, type Page } from "@playwright/test";
import { test as previewTest, watchBrowser } from "./preview";
import { dartPixels } from "./dart-pixels";
import { airplaneText, sheetText } from "../../app/lesson/airplane.en";

const path = "/en/lessons/paper-airplane";
const actions = [
  "mark-spine",
  "open-sheet",
  "left-corner",
  "right-corner",
  "left-taper",
  "right-taper",
  "close-body",
  "left-wing",
  "right-wing",
] as const;
const durations = [1600, 1600, 1500, 1500, 1800, 1800, 1800, 1500, 1500];
const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });
const meter = (page: Page) => page.getByRole("meter", { name: "Lesson progress" });
const test = previewTest.extend<{ errors: string[] }>({
  errors: [
    async ({ page, baseURL, javaScriptEnabled }, use) => {
      const errors = watchBrowser(page, baseURL, javaScriptEnabled);
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

async function ready(page: Page) {
  await expect(button(page, "Orbit left")).toBeEnabled();
  await expect(page.locator("canvas")).toHaveCount(1);
}
async function endpoint(page: Page, n: number) {
  const copy = n ? airplaneText[atIndex(actions, n - 1)] : sheetText;
  const notes = page.getByRole("region", { name: "Fold instruction" });
  await expect(meter(page)).toHaveJSProperty("value", n);
  await expect(notes.getByRole("heading")).toHaveText(copy.title);
  await expect(notes.getByText(copy.instruction, { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: copy.result, exact: true })).toBeVisible();
}

test.describe("static dart instructions", () => {
  test.use({ javaScriptEnabled: false });
  test("the direct document and refresh contain the finished lesson and all nine readable steps", async ({
    page,
  }) => {
    for (const visit of [() => page.goto(path), () => page.reload()]) {
      const response = await visit();
      expect(response?.status()).toBe(200);
      const html = await response?.text();
      expect(html).toContain("<h1>Dart paper airplane</h1>");
      expect(html).toContain(airplaneText["right-wing"].instruction);
      await expect(page).toHaveTitle("Dart paper airplane · Oripo");
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        /pointed dart/,
      );
      await expect(page.locator("canvas")).toHaveCount(0);
      await expect(button(page, "Next")).toBeDisabled();
      const details = page.locator("details");
      if (!(await details.evaluate((el) => el.hasAttribute("open"))))
        await details.locator("summary").click();
      await expect(details.getByRole("listitem")).toHaveCount(9);
      for (const [index, id] of actions.entries()) {
        const item = details.getByRole("listitem").nth(index);
        await expect(item.getByText(airplaneText[id].instruction, { exact: true })).toBeVisible();
        await expect(item.getByText(airplaneText[id].result, { exact: true })).toBeVisible();
      }
    }
  });
});

test("playable catalog to nine folds, in-flight reversal, final dart, replay and full return", async ({
  page,
}, testInfo) => {
  const sceneRequests: string[] = [];
  page.on("request", (r) => {
    if (/\/(?:studio\.client|(?:airplane-)?scene\.client)-/.test(r.url()))
      sceneRequests.push(new URL(r.url()).pathname);
  });
  await page.setViewportSize({ width: 1280, height: 920 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.goto("/en");
  await expect(page.getByLabel("Appearance")).toBeEnabled();
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("link", { name: "Dart paper airplane" }) });
  await expect(card.getByText("Playable lesson")).toBeVisible();
  expect(sceneRequests).toEqual([]);
  await card.getByRole("link").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(path + "$"));
  await ready(page);
  expect(sceneRequests.some((s) => s.includes("/studio.client-"))).toBe(true);
  expect(sceneRequests.some((s) => s.includes("/airplane-scene.client-"))).toBe(true);
  await page.clock.pauseAt(new Date("2026-01-01T12:02:00Z"));
  await endpoint(page, 0);
  const flat = await dartPixels(page, "sheet");
  expect(flat.iou).toBeGreaterThan(0.93);
  const samples: Record<string, typeof flat> = { flat };
  for (let n = 1; n <= 9; n++) {
    const next = button(page, "Next");
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(next).toBeFocused();
    await expect(next).toBeDisabled();
    if (n === 8) {
      await page.clock.fastForward(750);
      await expect(meter(page)).toHaveJSProperty("value", 7.5);
      const mid = await dartPixels(page, { left: 42, right: 0 });
      expect(mid.iou).toBeGreaterThan(0.9);
      samples.mid = mid;
      await button(page, "Previous").click();
      await expect(meter(page)).toHaveJSProperty("value", 7.5);
      await page.clock.fastForward(375);
      await expect(meter(page)).toHaveJSProperty("value", 7.25);
      await next.click();
      await page.clock.fastForward(375);
      expect((await dartPixels(page, { left: 42, right: 0 })).hash).toBe(mid.hash);
      await page.clock.fastForward(750);
    } else await page.clock.fastForward(atIndex(durations, n - 1));
    await endpoint(page, n);
    await expect(page.getByRole("status")).toContainText(`Reached step ${n} of 9`);
  }
  const dart = await dartPixels(page, { left: 84, right: 84 });
  expect(dart.iou).toBeGreaterThan(0.92);
  expect(dart.green).toBeGreaterThan(800);
  expect(dart.gold).toBeGreaterThan(400);
  expect(samples.mid).toBeDefined();
  expect(dart.hash).not.toBe(samples.mid?.hash);
  samples.finished = dart;
  await button(page, "Replay").click();
  await page.clock.fastForward(750);
  await expect(meter(page)).toHaveJSProperty("value", 8.5);
  await page.clock.fastForward(750);
  await expect(meter(page)).toHaveJSProperty("value", 8);
  await page.clock.fastForward(1500);
  await endpoint(page, 9);
  expect((await dartPixels(page, { left: 84, right: 84 })).hash).toBe(dart.hash);
  for (let n = 9; n > 0; n--) {
    await button(page, "Previous").click();
    await page.clock.fastForward(atIndex(durations, n - 1));
    await endpoint(page, n - 1);
  }
  await expect(button(page, "Previous")).toBeDisabled();
  expect(await dartPixels(page, "sheet")).toEqual(flat);
  await testInfo.attach("projected-paper", {
    body: JSON.stringify(samples),
    contentType: "application/json",
  });
});

for (const width of [320, 390])
  test(`the actual ${width}px viewport paints the dart with reduced motion, themes and a separate camera`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    for (const visit of [() => page.goto(path), () => page.reload()]) {
      expect((await visit())?.status()).toBe(200);
      await ready(page);
      await endpoint(page, 0);
    }
    const theme = page.getByLabel("Appearance");
    for (const [choice, scheme] of [
      ["oripo-light", "light"],
      ["oripo-dark", "dark"],
      ["system", "dark"],
    ] as const) {
      await theme.selectOption(choice);
      await expect(page.locator("html")).toHaveCSS("color-scheme", scheme);
    }
    for (let n = 1; n <= 9; n++) {
      await button(page, "Next").click();
      await endpoint(page, n);
    }
    const screenshot = await dartPixels(page, { left: 84, right: 84 });
    expect(screenshot.iou).toBeGreaterThan(0.86);
    const reading = page.locator(".lab-reading"),
      home = await reading.innerText();
    await button(page, "Orbit right").click();
    await expect(reading).not.toHaveText(home);
    const angled = await reading.innerText();
    await button(page, "Zoom in").click();
    await expect(reading).not.toHaveText(angled);
    await endpoint(page, 9);
    await button(page, "Reset view").click();
    await expect(reading).toHaveText(home);
    expect((await dartPixels(page, { left: 84, right: 84 })).hash).toBe(screenshot.hash);
    await button(page, "Replay").focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText("Replay complete");
    await expect(button(page, "Replay")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

test("missing WebGL provides all nine text poses, the transcript and instant reversal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, name: string, ...args: unknown[]) {
        return name === "webgl2" ? null : Reflect.apply(original, this, [name, ...args]);
      },
    });
  });
  await page.goto(path);
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  for (let n = 1; n <= 9; n++) {
    await button(page, "Next").click();
    await expect(page.locator(".lab-placeholder")).toContainText(
      airplaneText[atIndex(actions, n - 1)].result,
    );
  }
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(button(page, "Reset view")).toBeDisabled();
  await button(page, "Previous").click();
  await expect(meter(page)).toHaveJSProperty("value", 8);
});

test.describe("touch on the dart workbench", { tag: "@cdp" }, () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  test("one-finger orbit and pinch leave the current fold intact while a swipe on the notes scrolls", async ({
    page,
    context,
  }) => {
    await page.goto(path);
    await ready(page);
    await button(page, "Next").tap();
    await inspectByTouch(page, context);
    await endpoint(page, 1);
  });
});

test("loss of a real context during a wing fold preserves its destination in the text player", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  await ready(page);
  for (let n = 0; n < 7; n++) await button(page, "Next").click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button(page, "Next").click();
  await page.locator("canvas").evaluate((c) => {
    const extension =
      c instanceof HTMLCanvasElement && c.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Cannot exercise WebGL context loss");
    extension.loseContext();
  });
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  await expect(page.locator(".lab-placeholder")).toContainText(airplaneText["left-wing"].result);
  await expect(meter(page)).toHaveJSProperty("value", 8);
  await button(page, "Next").click();
  await expect(page.getByRole("status")).toContainText("Your dart is complete");
});

test("switching motion preference settles the selected step and back navigation creates one fresh sheet", async ({
  page,
}) => {
  await page.goto(path);
  await ready(page);
  const context = await page
    .locator("canvas")
    .evaluateHandle((c) => (c instanceof HTMLCanvasElement ? c.getContext("webgl2") : null));
  await button(page, "Next").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await endpoint(page, 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button(page, "Next").click();
  await page.getByRole("link", { name: "Back to Explore" }).click();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect.poll(() => context.evaluate((gl) => gl?.isContextLost())).toBe(true);
  await context.dispose();
  await page.goBack();
  await ready(page);
  await endpoint(page, 0);
});
