import { expect, type Page } from "@playwright/test";
import { test, watchBrowser } from "./preview";

// Endpoints of the leading leg on the collapsed base, expressed in studio space.
// Project the independently fixed score and count ink in its interior corridor.
async function leadingLegInk(page: Page, eye: [number, number, number]) {
  const png = await page.locator("canvas").screenshot();
  return page.evaluate(
    async ({ png, eye }) => {
      const img = await createImageBitmap(
        new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: "image/png" }),
      );
      const c = document.createElement("canvas"),
        w = (c.width = img.width),
        h = (c.height = img.height),
        ctx = c.getContext("2d");
      if (!ctx) throw Error("Missing pixel sampling context");
      ctx.drawImage(img, 0, 0);
      img.close();
      const pixels = new DataView(ctx.getImageData(0, 0, w, h).data.buffer);
      const [ex, ey, ez] = eye,
        r = Math.hypot(...eye),
        xy = Math.hypot(ex, ey),
        f = h / (2 * Math.tan(Math.PI / 9));
      function project(x: number, y: number) {
        x *= 0.92;
        y = (y + 0.43) * 0.92;
        const z = r - (x * ex + y * ey) / r;
        return {
          x: w / 2 + (f * (-ey * x + ex * y)) / (xy * z),
          y: h / 2 + (f * (ex * x + ey * y) * ez) / (xy * r * z),
        };
      }
      const a = project(-0.4084090909, -1),
        b = project(-0.0703571429, -0.0703571429);
      const indices = new Set<number>();
      for (let i = 8; i <= 92; i++)
        for (let u = -3; u <= 3; u++)
          for (let v = -3; v <= 3; v++)
            indices.add(
              4 *
                ((Math.round(a.y + ((b.y - a.y) * i) / 100) + v) * w +
                  Math.round(a.x + ((b.x - a.x) * i) / 100) +
                  u),
            );
      let ink = 0;
      for (const i of indices) {
        const r = pixels.getUint8(i),
          g = pixels.getUint8(i + 1),
          b = pixels.getUint8(i + 2);
        if (r - g > 50 && g - b > 23 && g < 140 && r >= 128 && r < 205) ink++;
      }
      return ink;
    },
    { png: png.toString("base64"), eye },
  );
}
test("the dinosaur turns before its hidden leg moves and its crease disappears behind the cover", async ({
  page,
  baseURL,
}, info) => {
  const errors = watchBrowser(page, baseURL);
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
  await page.goto("/en/lessons/reed-runner-dinosaur");
  const ready = page.getByRole("button", { name: "Zoom in" }),
    next = page.getByRole("button", { name: "Next fold" }),
    range = page.getByRole("slider"),
    reading = page.locator(".lab-reading"),
    cv = page.locator("canvas");
  await expect(ready).toBeEnabled();
  await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
  await range.fill(".99");
  await next.click();
  await page.clock.fastForward(200);
  await expect(range).toHaveValue("1");
  const front = await reading.innerText();
  const shot = (name: string) => cv.screenshot({ path: info.outputPath(name + ".png") });
  await next.click();
  await shot("start");
  await page.clock.fastForward(256);
  await expect(reading).not.toHaveText(front);
  await expect(range).toHaveValue("1");
  await page.getByRole("button", { name: "Pause playback" }).click();
  const frozen = await reading.innerText();
  await page.clock.fastForward(9000);
  await expect(reading).toHaveText(frozen);
  await page.getByRole("button", { name: "Play all folds" }).click();
  await page.clock.fastForward(430);
  await expect(range).toHaveValue("1");
  await shot("oriented");
  const back = await reading.innerText();
  const eye: [number, number, number] = [3.12, 0, -1.8];
  const visible = await leadingLegInk(page, eye);
  expect(visible).toBeGreaterThan(8);
  await page.clock.fastForward(600);
  expect(Number(await range.inputValue())).toBeGreaterThan(1);
  await shot("moving");
  await range.fill("1");
  await page.clock.runFor(32);
  await expect(reading).toHaveText(back);
  for (let i = 0; i < 12; i++) await page.locator(".studio-canvas").press("ArrowUp");
  await range.focus();
  await page.clock.runFor(32);
  await shot("covered");
  const az = Math.atan2(eye[1], eye[0]),
    r = Math.hypot(...eye),
    e = (11 * Math.PI) / 24;
  const hidden = await leadingLegInk(page, [
    r * Math.cos(e) * Math.cos(az),
    r * Math.cos(e) * Math.sin(az),
    r * Math.sin(e),
  ]);
  expect(hidden).toBeLessThan(visible * 0.12);
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(reading).toHaveText(back);
  await expect(range).toHaveValue("1");
  console.info(info.project.name, "leading leg ink, accessible and covered", visible, hidden);
  expect(errors).toEqual([]);
});
for (const [id, boundary] of [
  ["jumping-frog", 5],
  ["monarch-butterfly", 12],
  ["twin-stern-junk", 25],
] as const)
  test(
    id + " holds the boundary during inspection and cancels a stale turn on seek",
    async ({ page }) => {
      await page.clock.install({ time: new Date("2026-01-01T10:00:00Z") });
      await page.goto("/en/lessons/" + id);
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeEnabled();
      await page.clock.pauseAt(new Date("2026-01-01T10:02:00Z"));
      const range = page.getByRole("slider"),
        reading = page.locator(".lab-reading"),
        next = page.getByRole("button", { name: "Next fold" });
      await range.fill(String(boundary - 0.01));
      await next.click();
      await page.clock.fastForward(150);
      const old = await reading.innerText();
      await next.click();
      await page.clock.fastForward(250);
      await expect(range).toHaveValue(String(boundary));
      await expect(reading).not.toHaveText(old);
      await page.locator(".studio-canvas").press("ArrowLeft");
      const manual = await reading.innerText();
      await page.clock.fastForward(180);
      expect(Number(await range.inputValue())).toBeGreaterThan(boundary);
      await expect(reading).toHaveText(manual);
      await range.press("Home");
      await page.clock.fastForward(9000);
      await expect(range).toHaveValue("0");
    },
  );
