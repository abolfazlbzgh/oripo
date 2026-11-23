import type { Page } from "@playwright/test";

type Point = [number, number, number];
type Silhouette = "sheet" | { left: number; right: number };
const nose: Point = [0, 1.5, 0];
const tail: Point = [0, -1.5, 0];
const root: Point = [0, -1.5, 0.3];
const rad = Math.PI / 180;

// Independently construct the dart's exterior from the crease dimensions. Interior
// triangles, paper buffer attributes and camera matrices from the app are never read.
function outlines(shape: Silhouette): Point[][] {
  if (shape === "sheet")
    return [
      [
        [-1, -1.5, 0],
        [1, -1.5, 0],
        [1, 1.5, 0],
        [-1, 1.5, 0],
      ],
    ];
  const beta = Math.atan(0.1);
  const polygons: Point[][] = [[nose, tail, root]];
  for (const side of [-1, 1]) {
    const angle = (side < 0 ? shape.left : shape.right) * rad;
    const wingPoint = (u: number, v: number): Point => {
      const along = v * Math.cos(beta) + u * Math.sin(beta),
        across = u * Math.cos(beta) - v * Math.sin(beta);
      return [
        side * across * Math.sin(angle),
        1.5 - along * Math.cos(beta) + across * Math.sin(beta) * Math.cos(angle),
        along * Math.sin(beta) + across * Math.cos(beta) * Math.cos(angle),
      ];
    };
    polygons.push([nose, wingPoint(1, 1 / Math.tan(Math.PI / 8)), wingPoint(1, 3), root]);
  }
  return polygons;
}

export async function dartPixels(page: Page, shape: Silhouette) {
  const png = await page.locator("canvas").screenshot();
  return page.evaluate(
    async ({ encoded, polygons }) => {
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

      const [ex, ey, ez] = [2.4, -3.35, 4] as const;
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
      return { iou: inside / union, green, gold, hash };
    },
    { encoded: png.toString("base64"), polygons: outlines(shape) },
  );
}
