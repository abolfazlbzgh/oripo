import { it, expect } from "vitest";
import { chartPoint, prepareChart } from "../../app/lesson/rigid-field";
import { difference } from "../../app/lesson/geometry";
import type { Point } from "../../app/fold/geometry";
it("opens a pinned pocket and sends the free corner across the held edge on both sides", () => {
  let error = 0;
  for (const inward of [-1, 1] as const) {
    const map = (sector: "lip" | "gusset" | "cover") =>
      prepareChart({ kind: "pocket-squash", center: [0, 0], inward, sector, landingPly: 0 }, 0, 0);
    const lip = map("lip"),
      gusset = map("gusset"),
      cover = map("cover");
    const q: Point = [inward, 0, 0],
      r: Point = [0, 1, 0],
      b: Point = [inward, 1, 0];
    const dist = (a: Point, b: Point) => Math.hypot(...difference(a, b));
    for (let n = 0; n <= 1000; n++) {
      const t = n / 1000,
        l = lip(t),
        g = gusset(t),
        c = cover(t);
      const rim = chartPoint(l, q),
        tip = chartPoint(c, b);
      error = Math.max(
        error,
        dist(chartPoint(l, b), b),
        dist(chartPoint(c, r), r),
        dist(chartPoint(g, q), rim),
        dist(chartPoint(g, b), tip),
        Math.abs(dist(rim, tip) - 1),
        Math.abs(dist(r, tip) - 1),
        Math.abs(Math.hypot(...tip) - Math.SQRT2),
      );
      if (n > 0 && n < 1000 && !(rim[2] > 0 && tip[2] > 0))
        throw Error("Closed pocket at an interior pose");
      if (n === 500) {
        expect(rim[2]).toBeCloseTo(Math.SQRT1_2, 12);
        expect(tip[2]).toBeCloseTo((2 * Math.SQRT2) / 3, 12);
      }
      if (n === 1000) expect(tip).toEqual([-inward, 1, 0]);
    }
  }
  expect(error).toBeLessThan(1e-12);
  console.info("Square pocket fixture seam/rigidity", error);
});
