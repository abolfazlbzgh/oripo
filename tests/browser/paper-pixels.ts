import type { Page } from "@playwright/test";
export type Point = [number, number, number];

export async function paperPixels(
  page: Page,
  polygons: Point[][],
  eye: Point,
  probes: Point[] = [],
) {
  const png = await page.locator("canvas").screenshot();
  return page.evaluate(
    async ({ encoded, polygons, eye, probes }) => {
      const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = document.createElement("canvas");
      const w = (canvas.width = bitmap.width),
        h = (canvas.height = bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot read production canvas pixels");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = new DataView(ctx.getImageData(0, 0, w, h).data.buffer);
      ctx.clearRect(0, 0, w, h);

      const [ex, ey, ez] = eye;
      const ground = Math.hypot(ex, ey),
        distance = Math.hypot(ground, ez),
        focal = h / (2 * Math.tan(Math.PI / 9));
      const project = ([x, y, z]: Point) => {
        const depth = distance - (x * ex + y * ey + z * ez) / distance;
        const horizontal = (-ey * x + ex * y) / ground;
        const vertical = ((-(ex * x + ey * y) * ez) / ground + ground * z) / distance;
        return [w / 2 + (horizontal * focal) / depth, h / 2 - (vertical * focal) / depth] as const;
      };
      for (const polygon of polygons) {
        ctx.beginPath();
        polygon.forEach((p, i) => {
          const [x, y] = project(p);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
      }
      const mask = new DataView(ctx.getImageData(0, 0, w, h).data.buffer);
      let inside = 0,
        union = 0,
        green = 0,
        gold = 0,
        hash = 2166136261;
      for (let i = 0; i < pixels.byteLength; i += 4) {
        const r = pixels.getUint8(i),
          g = pixels.getUint8(i + 1),
          b = pixels.getUint8(i + 2);
        const front = g - r > 14 && g - b > 8 && g > 90;
        const back = r - g > 18 && g - b > 16 && r > 105;
        if (front) green++;
        if (back) gold++;
        const actual = front || back,
          expected = mask.getUint8(i + 3) > 127;
        if (actual && expected) inside++;
        if (actual || expected) union++;
        hash = Math.imul(hash ^ (front ? 1 : back ? 2 : 0), 16777619);
      }
      const colors = probes.map((p) => {
        const [x, y] = project(p);
        const counts = { green: 0, gold: 0 };
        for (let u = -2; u <= 2; u++)
          for (let v = -2; v <= 2; v++) {
            const offset = 4 * ((Math.round(y) + v) * w + Math.round(x) + u);
            const r = pixels.getUint8(offset),
              g = pixels.getUint8(offset + 1),
              b = pixels.getUint8(offset + 2);
            if (g - r > 14 && g - b > 8 && g > 90) counts.green++;
            if (r - g > 18 && g - b > 16 && r > 105) counts.gold++;
          }
        return counts.gold >= 13 ? "gold" : counts.green >= 13 ? "green" : "other";
      });
      return { iou: inside / union, green, gold, hash, colors };
    },
    { encoded: png.toString("base64"), polygons, eye, probes },
  );
}
