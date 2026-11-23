import { expect, type Page } from "@playwright/test";
import { test as previewTest, watchBrowser } from "./preview";

const lab = "/en/lab/first-fold";
const test = previewTest.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page, baseURL, javaScriptEnabled }, use) => {
      const errors = watchBrowser(page, baseURL, javaScriptEnabled);
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});

function button(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}
async function rendered(page: Page) {
  await expect(button(page, "Orbit left")).toBeEnabled();
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const webgl = await canvas.evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) return false;
    const gl = el.getContext("webgl2");
    return (
      gl instanceof WebGL2RenderingContext &&
      !gl.isContextLost() &&
      gl.drawingBufferWidth > 100 &&
      gl.drawingBufferHeight > 100
    );
  });
  expect(webgl).toBe(true);
}
async function atAngle(page: Page, degrees: number) {
  const meter = page.getByRole("meter", { name: "Fold angle" });
  await expect(meter).toHaveJSProperty("value", degrees);
  await expect(meter).toHaveAttribute("aria-valuetext", `${Math.round(degrees)} degrees`);
}

// Count visible paper in the composited canvas. A blank context, a fallback, and a
// moving panel that merely disappears at 180° each fail a different assertion.
async function paperPixels(page: Page) {
  const png = await page.locator("canvas").screenshot();
  return page.evaluate(async (encoded) => {
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const image = document.createElement("canvas");
    image.width = bitmap.width;
    image.height = bitmap.height;
    const ctx = image.getContext("2d");
    if (!ctx) throw new Error("Pixel readback unavailable");
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = new DataView(ctx.getImageData(0, 0, image.width, image.height).data.buffer);
    const fixed = { count: 0, x: 0, y: 0 };
    const moving = { count: 0, x: 0, y: 0 };
    for (let i = 0; i < pixels.byteLength; i += 4) {
      const r = pixels.getUint8(i);
      const g = pixels.getUint8(i + 1);
      const b = pixels.getUint8(i + 2);
      const part = g - r > 12 && g - b > 8 ? fixed : r - g > 12 && g - b > 20 ? moving : null;
      if (!part) continue;
      part.count++;
      part.x += (i / 4) % image.width;
      part.y += Math.floor(i / 4 / image.width);
    }
    for (const part of [fixed, moving]) {
      if (part.count) {
        part.x /= part.count;
        part.y /= part.count;
      }
    }
    return { fixed, moving };
  }, png.toString("base64"));
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("direct load and refresh serve the step, controls and a readable initial diagram description", async ({
    page,
  }) => {
    for (const visit of [() => page.goto(lab), () => page.reload()]) {
      const response = await visit();
      expect(response?.status()).toBe(200);
      expect(await response?.text()).not.toContain("<canvas");
      await expect(page).toHaveTitle("The first fold · Oripo");
      await expect(page.getByRole("heading", { name: "Unfolded", exact: true })).toBeVisible();
      await expect(page.getByText("A center crease divides", { exact: false })).toBeVisible();
      await expect(page.getByText("Enable JavaScript", { exact: false })).toBeVisible();
      await expect(page.getByRole("group", { name: "Fold controls" })).toBeVisible();
      await expect(button(page, "Next")).toBeDisabled();
      await expect(page.locator("canvas")).toHaveCount(0);
    }
  });
});

test("desktop direct load and refresh render paper, then fold onto the fixed panel's pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  for (const visit of [() => page.goto(lab), () => page.reload()]) {
    expect((await visit())?.status()).toBe(200);
    await rendered(page);
    await expect(page.getByRole("heading", { name: "The first fold" })).toBeVisible();
    await atAngle(page, 0);
  }
  const flat = await paperPixels(page);
  expect(flat.fixed.count).toBeGreaterThan(1000);
  expect(flat.moving.count).toBeGreaterThan(1000);
  expect(flat.moving.x).toBeGreaterThan(flat.fixed.x + 20);
  await button(page, "Next").click();
  await atAngle(page, 180);
  const folded = await paperPixels(page);
  expect(folded.fixed.count).toBeLessThan(flat.fixed.count * 0.035);
  expect(folded.moving.count / flat.fixed.count).toBeCloseTo(1, 1);
  expect(Math.abs(folded.moving.x - flat.fixed.x)).toBeLessThan(2);
  expect(Math.abs(folded.moving.y - flat.fixed.y)).toBeLessThan(2);
  await button(page, "Previous").click();
  await atAngle(page, 0);
  expect(await paperPixels(page)).toEqual(flat);
  await page.setViewportSize({ width: 900, height: 700 });
  await expect.poll(async () => (await paperPixels(page)).fixed.count).toBeGreaterThan(1000);
  await atAngle(page, 0);
});

test("timed motion reverses continuously, preserves an orbit and replays from flat", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.goto(lab);
  await rendered(page);
  await page.clock.pauseAt(new Date("2026-01-01T12:01:00Z"));
  const flatPixels = await paperPixels(page);
  await button(page, "Next").click();
  await expect(button(page, "Next")).toBeDisabled();
  await expect(button(page, "Previous")).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Folding", exact: true })).toBeVisible();
  await page.clock.fastForward(1500);
  await atAngle(page, 90);
  const uprightPixels = await paperPixels(page);
  expect(uprightPixels.fixed.count).toBeGreaterThan(1000);
  expect(uprightPixels.moving.count).toBeGreaterThan(500);
  expect(uprightPixels.moving.y).toBeLessThan(flatPixels.moving.y - 15);
  const reading = page.locator(".lab-reading");
  const originalView = await reading.innerText();
  await button(page, "Orbit left").focus();
  await page.keyboard.press("Enter");
  await expect(reading).not.toHaveText(originalView);
  const orbit = await reading.innerText();
  await button(page, "Zoom in").focus();
  await page.keyboard.press("Space");
  await expect(reading).not.toHaveText(orbit);
  const inspectedView = await reading.innerText();
  await atAngle(page, 90);
  await page.clock.fastForward(375);
  const inspectedAngle = 112.5;
  await atAngle(page, inspectedAngle);
  const inspectedPixels = await paperPixels(page);
  await button(page, "Previous").click();
  await atAngle(page, inspectedAngle);
  await page.clock.fastForward(750);
  await atAngle(page, inspectedAngle - 45);
  await expect(page.getByRole("heading", { name: "Unfolding", exact: true })).toBeVisible();
  await button(page, "Next").click();
  await atAngle(page, inspectedAngle - 45);
  await page.clock.fastForward(750);
  await atAngle(page, inspectedAngle);
  expect(await paperPixels(page)).toEqual(inspectedPixels);
  await page.clock.fastForward(60000);
  await atAngle(page, 180);
  await expect(page.getByRole("status")).toHaveText(/Fold complete/);
  await expect(reading).toHaveText(inspectedView);
  await button(page, "Replay").click();
  await atAngle(page, 0);
  await page.clock.fastForward(1500);
  await atAngle(page, 90);
  await button(page, "Replay").dblclick();
  await atAngle(page, 0);
  await page.clock.fastForward(750);
  await atAngle(page, 45);
  await button(page, "Previous").click();
  await page.clock.fastForward(750);
  await atAngle(page, 0);
  await expect(button(page, "Previous")).toBeDisabled();
  await expect(button(page, "Next")).toBeEnabled();
  await expect(page.getByRole("status")).toHaveText(/square again/);
  await expect(reading).toHaveText(inspectedView);
});

test("pointer orbit, wheel zoom, resize and a preference switch preserve the current target", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.goto(lab);
  await rendered(page);
  await page.clock.pauseAt(new Date("2026-01-01T12:01:00Z"));
  await button(page, "Next").click();
  await page.clock.fastForward(1500);
  await atAngle(page, 90);
  const reading = page.locator(".lab-reading");
  const initial = await reading.innerText();
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Missing paper canvas");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 45, y + 12, { steps: 4 });
  await page.mouse.up();
  await expect(reading).not.toHaveText(initial);
  const afterDrag = await reading.innerText();
  await page.mouse.wheel(0, -120);
  await expect(reading).not.toHaveText(afterDrag);
  await page.setViewportSize({ width: 640, height: 680 });
  await atAngle(page, 90);
  await button(page, "Reset view").click();
  await expect(reading).toHaveText(initial);
  await atAngle(page, 90);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await atAngle(page, 180);
  await expect(page.getByRole("status")).toHaveText(/Fold complete/);
  await button(page, "Previous").click();
  await atAngle(page, 0);
  await button(page, "Replay").click();
  await atAngle(page, 180);
  await expect(page.getByRole("status")).toHaveText(/Replay complete/);
});

test.describe("narrow touch viewport", { tag: "@cdp" }, () => {
  test.use({
    viewport: { width: 320, height: 720 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
    colorScheme: "dark",
  });
  test("one-finger orbit and pinch zoom work at 320px in system and explicit themes", async ({
    page,
    context,
  }) => {
    await page.goto("/en");
    await page.getByRole("link", { name: "Open the 3D studio" }).tap();
    await rendered(page);
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    for (const [setting, scheme] of [
      ["oripo-light", "light"],
      ["oripo-dark", "dark"],
      ["system", "dark"],
    ] as const) {
      await page.getByLabel("Appearance").selectOption(setting);
      await expect(page.locator("html")).toHaveCSS("color-scheme", scheme);
      expect(await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth])).toEqual(
        [320, 320],
      );
    }
    await button(page, "Next").tap();
    await atAngle(page, 180);
    const canvas = page.locator("canvas");
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Missing touch surface");
    const x = Math.round(box.x + box.width / 2);
    const y = Math.round(box.y + box.height / 2);
    const session = await context.newCDPSession(page);
    const touch = (
      type: "touchStart" | "touchMove" | "touchEnd",
      points: { x: number; y: number; id: number }[],
    ) => session.send("Input.dispatchTouchEvent", { type, touchPoints: points });
    const reading = page.locator(".lab-reading");
    const start = await reading.innerText();
    await touch("touchStart", [{ x, y, id: 1 }]);
    await touch("touchMove", [{ x: x + 30, y: y + 5, id: 1 }]);
    await touch("touchEnd", []);
    await expect(reading).not.toHaveText(start);
    const zoom = (await reading.innerText()).split(" · ")[2];
    await touch("touchStart", [
      { x: x - 16, y, id: 1 },
      { x: x + 16, y, id: 2 },
    ]);
    await touch("touchMove", [
      { x: x - 32, y, id: 1 },
      { x: x + 32, y, id: 2 },
    ]);
    await touch("touchEnd", []);
    await expect.poll(async () => (await reading.innerText()).split(" · ")[2]).not.toBe(zoom);
    await atAngle(page, 180);
    await button(page, "Previous").tap();
    await atAngle(page, 0);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth])).toEqual([
      320, 320,
    ]);
    await button(page, "Next").tap();
    await atAngle(page, 180);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await rendered(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const label = await page.getByText("Fold angle", { exact: true }).boundingBox();
    if (!label) throw new Error("Missing angle label");
    const startView = await reading.innerText();
    const swipe = {
      x: Math.round(label.x + label.width / 2),
      y: Math.round(label.y + label.height / 2),
      id: 1,
    };
    await touch("touchStart", [swipe]);
    for (let distance = 10; distance <= 100; distance += 10) {
      await touch("touchMove", [{ ...swipe, y: swipe.y - distance }]);
    }
    await touch("touchEnd", []);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(reading).toHaveText(startView);
    await atAngle(page, 0);
    await session.detach();
  });
});

test("missing WebGL leaves the text player usable", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, name: string, ...options: unknown[]) {
        return name === "webgl2" ? null : Reflect.apply(getContext, this, [name, ...options]);
      },
    });
  });
  await page.goto(lab);
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(button(page, "Zoom in")).toBeDisabled();
  await expect(button(page, "Reset view")).toBeDisabled();
  await button(page, "Next").click();
  await atAngle(page, 180);
  await expect(page.getByRole("heading", { name: "Folded", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText(/two halves overlap/);
  await button(page, "Previous").click();
  await atAngle(page, 0);
});

test("context loss during a fold settles its target and leaves both text steps operable", async ({
  page,
}) => {
  await page.goto(lab);
  await rendered(page);
  await button(page, "Next").click();
  await expect(page.getByRole("heading", { name: "Folding", exact: true })).toBeVisible();
  await page.locator("canvas").evaluate((el) => {
    if (!(el instanceof HTMLCanvasElement)) throw new Error("Missing canvas");
    const loss = el.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!loss) throw new Error("Cannot exercise WebGL context loss");
    loss.loseContext();
  });
  await expect(page.getByText("3D view unavailable", { exact: true })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await atAngle(page, 180);
  await button(page, "Previous").click();
  await atAngle(page, 0);
  await expect(button(page, "Next")).toBeEnabled();
});

test("route exit during motion releases the old GL context, and return opens one fresh sheet", async ({
  page,
}) => {
  await page.goto(lab);
  await rendered(page);
  const context = await page
    .locator("canvas")
    .evaluateHandle((el) => (el instanceof HTMLCanvasElement ? el.getContext("webgl2") : null));
  await button(page, "Next").click();
  await expect(page.getByRole("heading", { name: "Folding", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to Explore" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect.poll(() => context.evaluate((gl) => gl?.isContextLost())).toBe(true);
  await context.dispose();
  // Complete the catalog's required image before the next route retires its request.
  await page
    .locator('img[src="/paper-crane.svg"]')
    .evaluate((el) => (el as HTMLImageElement).decode());
  await page.getByRole("link", { name: "Open the 3D studio" }).click();
  await rendered(page);
  await atAngle(page, 0);
  await expect(button(page, "Previous")).toBeDisabled();
});
