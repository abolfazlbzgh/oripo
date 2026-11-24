import type { Page } from "@playwright/test";
import type { ModelId } from "../../app/lessons";
export type Point = [number, number, number];

export async function paperPixels(
  page: Page,
  polygons: Point[][],
  eye: Point,
  probes: Point[] = [],
  finish?: ModelId,
  includeCreaseInk = false,
) {
  const png = await page.locator("canvas").screenshot();
  return page.evaluate(
    async ({ encoded, polygons, eye, probes, finish, includeCreaseInk }) => {
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
        colored = 0,
        hash = 2166136261;
      function hue(r: number, g: number, b: number) {
        if (finish === "pinwheel-calyx")
          return r - g > 36 && r - g > 2 * (g - b) ? "coral" : "other";
        if (finish === "river-tern")
          return b - r > 31 && g - r > 16 && b - g > 8 ? "blue" : "other";
        if (finish === "hex-iris") {
          // Gold and violet meet at antialiased crease strokes. Count their mixed pigment for silhouettes.
          if (includeCreaseInk && r - g > 8 && r < 202 && b > g - 50) return "iris";
          return (r - g > 28 && g - b > 1.48 * (r - g)) || (b - r > 15 && r - g > 9)
            ? "iris"
            : "other";
        }
        if (finish === "jumping-frog")
          return g - b > 40 && g - r > 11 && r - b > 12 ? "leaf" : "other";
        if (finish === "herringbone-map") return b - r > 17 && r - g > 12 ? "violet" : "other";
        if (finish === "masu-box")
          return g - r > 26 && b - r > 22 && Math.abs(b - g) < 25 ? "teal" : "other";
        if (finish === "paper-airplane") return b - g > 6 && g - r > 7 && b > 95 ? "blue" : "other";
        if (finish === "paper-heart")
          return r - g > 50 && b - g > 10 && r - b > 42 ? "rose" : "other";
        if (finish === "fox-face") {
          if (r - g > 63 && g - b > 38) return "orange";
          if (r - g > 1.25 * (g - b) && r - g > 27 && g - b > 16 && r - b > 48 && b > 94)
            return "apricot";
          return "other";
        }
        // Subpixel rim/crease strokes blend the two teaching pigments on small panels.
        if (includeCreaseInk && g - b > 12 && g > 80 && Math.abs(r - g) < 21) return "ink";
        if (g - r > 14 && g - b > 8 && g > 90) return "green";
        if (r - g > 18 && g - b > 16 && r > 105) return "gold";
        return "other";
      }
      for (let i = 0; i < pixels.byteLength; i += 4) {
        const r = pixels.getUint8(i),
          g = pixels.getUint8(i + 1),
          b = pixels.getUint8(i + 2);
        const front = g - r > 14 && g - b > 8 && g > 90;
        const back = r - g > 18 && g - b > 16 && r > 105;
        if (front) green++;
        if (back) gold++;
        const tone = hue(r, g, b);
        const actual = tone !== "other",
          expected = mask.getUint8(i + 3) > 127;
        if (actual && expected) inside++;
        if (actual || expected) union++;
        if (actual) colored++;
        hash = Math.imul(hash ^ (actual ? tone.charCodeAt(0) + tone.length : 0), 16777619);
      }
      const colors = probes.map((p) => {
        const [x, y] = project(p);
        const counts: Record<string, number> = {};
        for (let u = -2; u <= 2; u++)
          for (let v = -2; v <= 2; v++) {
            const offset = 4 * ((Math.round(y) + v) * w + Math.round(x) + u);
            const r = pixels.getUint8(offset),
              g = pixels.getUint8(offset + 1),
              b = pixels.getUint8(offset + 2);
            const tone = hue(r, g, b);
            counts[tone] = (counts[tone] ?? 0) + 1;
          }
        return Object.entries(counts).find(([, count]) => count >= 13)?.[0] ?? "other";
      });
      return { iou: inside / union, green, gold, colored, hash, colors };
    },
    { encoded: png.toString("base64"), polygons, eye, probes, finish, includeCreaseInk },
  );
}
