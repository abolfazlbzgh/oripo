import { expect, type Page, type BrowserContext } from "@playwright/test";

export async function inspectByTouch(page: Page, context: BrowserContext) {
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Missing touch surface");
  const x = Math.round(box.x + box.width / 2),
    y = Math.round(box.y + box.height / 2);
  const pageScroll = await page.evaluate(() => scrollY);
  const session = await context.newCDPSession(page);
  const touch = (
    type: "touchStart" | "touchMove" | "touchEnd",
    touchPoints: { id: number; x: number; y: number }[],
  ) => session.send("Input.dispatchTouchEvent", { type, touchPoints });
  const reading = page.locator(".lab-reading"),
    initial = await reading.innerText();
  await touch("touchStart", [{ id: 1, x, y }]);
  await touch("touchMove", [{ id: 1, x: x + 35, y: y + 7 }]);
  await touch("touchEnd", []);
  await expect(reading).not.toHaveText(initial);
  expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
  const zoom = (await reading.innerText()).split(" · ")[2];
  await touch("touchStart", [
    { id: 1, x: x - 15, y },
    { id: 2, x: x + 15, y },
  ]);
  await touch("touchMove", [
    { id: 1, x: x - 33, y },
    { id: 2, x: x + 33, y },
  ]);
  await touch("touchEnd", []);
  await expect.poll(async () => (await reading.innerText()).split(" · ")[2]).not.toBe(zoom);
  const after = await reading.innerText();
  await page.getByRole("button", { name: "Read step instructions" }).tap();
  await page.locator(".lesson-transcript summary").tap();
  const body = page.locator(".instruction-body");
  await body.evaluate((el) => {
    el.scrollTop = 0;
  });
  const notes = await body.boundingBox();
  if (!notes) throw new Error("Missing instruction");
  const point = {
    id: 1,
    x: Math.round(notes.x + notes.width / 2),
    y: Math.round(notes.y + notes.height * 0.75),
  };
  await touch("touchStart", [point]);
  for (let d = 10; d <= 100; d += 10) await touch("touchMove", [{ ...point, y: point.y - d }]);
  await touch("touchEnd", []);
  await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Close instructions" }).tap();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(reading).toHaveText(after);
  const range = page.getByRole("slider");
  const original = await range.inputValue();
  const track = await range.boundingBox();
  if (!track) throw Error("Missing touch timeline");
  await range.tap({
    position: { x: Math.floor(track.width * 0.63), y: Math.floor(track.height / 2) },
  });
  const fraction = Number(await range.inputValue());
  expect(fraction % 1).toBeGreaterThan(0);
  expect(fraction).not.toBe(Number(original));
  await range.fill(original);
  await session.detach();
}
