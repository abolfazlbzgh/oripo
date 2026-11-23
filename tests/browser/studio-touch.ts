import { expect, type Page, type BrowserContext } from "@playwright/test";

export async function inspectByTouch(page: Page, context: BrowserContext) {
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Missing touch surface");
  const x = Math.round(box.x + box.width / 2),
    y = Math.round(box.y + box.height / 2);
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
  await page.evaluate(() => scrollTo(0, 0));
  const notes = await page.getByRole("region", { name: "Fold instruction" }).boundingBox();
  if (!notes) throw new Error("Missing instruction");
  const point = { id: 1, x: Math.round(notes.x + 20), y: Math.round(notes.y + 25) };
  await touch("touchStart", [point]);
  for (let d = 10; d <= 100; d += 10) await touch("touchMove", [{ ...point, y: point.y - d }]);
  await touch("touchEnd", []);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect(reading).toHaveText(after);
  await session.detach();
}
