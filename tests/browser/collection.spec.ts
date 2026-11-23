import { expect } from "@playwright/test";
import { test, watchBrowser } from "./preview";

test("leaving before the scene downloads creates no abandoned WebGL context", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl2") performance.mark("oripo-webgl-request");
      return Reflect.apply(get, this, [type, ...args]);
    } as typeof get;
  });
  const chunk = /\/assets\/flat-scene\.client-[^/]+\.js$/;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(chunk, async (route) => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest(chunk);
  const delivered = page.waitForResponse(chunk);
  try {
    await page.goto("/en/lessons/fox-face", { waitUntil: "domcontentloaded" });
    await requested;
    await expect(page.getByRole("button", { name: "Next fold", exact: true })).toBeDisabled();
    await page.getByRole("banner").getByRole("link", { name: "Oripo", exact: true }).click();
    await expect(page.getByRole("main")).toBeFocused();
  } finally {
    release();
  }
  const response = await delivered;
  await response.finished();
  // Await evaluation of the same cached module and any pending mount callbacks.
  await page.evaluate(async (url) => {
    await import(url);
    await new Promise(requestAnimationFrame);
  }, response.url());
  expect(
    await page.evaluate(() => performance.getEntriesByName("oripo-webgl-request").length),
  ).toBe(0);
  await page.getByRole("link", { name: "Fox face", exact: true }).click();
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
  await expect(page.getByRole("slider")).toHaveJSProperty("valueAsNumber", 0);
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(errors).toEqual([]);
});

declare global {
  interface Window {
    lessonListenerCounts(): number[];
  }
}

test("switches dart to heart to fox to dart during playback and releases each studio", async ({
  page,
  baseURL,
}) => {
  const errors = watchBrowser(page, baseURL);
  await page.addInitScript(() => {
    const wheel = new Set(),
      keys = new Set(),
      motion = new Set();
    function listeners(
      target: EventTarget,
      type: string,
      options?: boolean | EventListenerOptions,
    ) {
      if (target instanceof HTMLCanvasElement && type === "wheel") return wheel;
      if (
        target === document &&
        type === "keydown" &&
        (options === true || (typeof options === "object" && options.capture))
      )
        return keys;
      if (
        target instanceof MediaQueryList &&
        target.media.includes("prefers-reduced-motion") &&
        type === "change"
      )
        return motion;
    }
    const add = EventTarget.prototype.addEventListener,
      remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      listeners(this, type, options)?.add(listener);
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      listeners(this, type, options)?.delete(listener);
      return remove.call(this, type, listener, options);
    };
    window.lessonListenerCounts = () => [wheel.size, keys.size, motion.size];
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  await expect(page.getByLabel("Appearance")).toBeEnabled();
  const counts = () => page.evaluate(() => window.lessonListenerCounts());
  const idle = await counts();
  const models = page
    .locator(".library article")
    .filter({ has: page.getByText("Playable lesson", { exact: true }) });
  await expect(models).toHaveCount(3);
  const contexts = [];
  for (const title of ["Dart paper airplane", "Paper heart", "Fox face", "Dart paper airplane"]) {
    await models.getByRole("link", { name: title, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    const canvas = page.locator("canvas"),
      progress = page.getByRole("slider");
    await expect(canvas).toHaveCount(1);
    await expect(progress).toHaveJSProperty("valueAsNumber", 0);
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    const live = await counts();
    expect(live.every((n, i) => n > (idle[i] ?? 0))).toBe(true);
    contexts.push(
      await canvas.evaluateHandle((c) => (c as HTMLCanvasElement).getContext("webgl2")),
    );
    await page.getByRole("button", { name: "Next fold", exact: true }).click();
    await expect
      .poll(() => progress.evaluate((el) => (el as HTMLInputElement).valueAsNumber))
      .toBeGreaterThan(0);
    await expect(progress).not.toHaveJSProperty("valueAsNumber", 1);
    await page.getByRole("banner").getByRole("link", { name: "Oripo", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
  }
  await expect.poll(counts).toEqual(idle);
  for (const handle of contexts) {
    await expect.poll(() => handle.evaluate((gl) => gl?.isContextLost())).toBe(true);
    await handle.dispose();
  }
  expect(errors).toEqual([]);
});
