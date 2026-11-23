import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import { chartPoint, prepareChart, type RigidField } from "../../app/lesson/rigid-field";
import { atIndex, difference } from "../../app/lesson/geometry";

const length = (a: Point, b: Point) => Math.hypot(...difference(a, b));
it("closes a waterbomb on the inward branch while both triangular pocket mouths have clearance", () => {
  const field = { kind: "waterbomb", center: [0, 0], radius: 1 } as const;
  const triangles: Point[][] = [
    [
      [0, 0, 0],
      [-1, -1, 0],
      [1, -1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [-1, 1, 0],
    ],
    ...[-1, 1].flatMap((s) =>
      [-1, 1].map(
        (y) =>
          [
            [0, 0, 0],
            [s, 0, 0],
            [s, y, 0],
          ] as Point[],
      ),
    ),
  ];
  const sides = triangles.map((tri) =>
    prepareChart(
      field,
      tri.reduce((s, p) => s + p[0], 0) / 3,
      tri.reduce((s, p) => s + p[1], 0) / 3,
    ),
  );
  let max = 0;
  for (let n = 0; n <= 1000; n++) {
    const t = n / 1000,
      seen = new Map<string, Point>();
    for (const [i, tri] of triangles.entries()) {
      const chart = atIndex(sides, i)(t);
      const mapped = tri.map((p) => chartPoint(chart, p));
      for (const [j, p] of tri.entries()) {
        const q = atIndex(mapped, j),
          previous = seen.get(String(p));
        if (previous) max = Math.max(max, length(previous, q));
        seen.set(String(p), q);
        for (let k = 0; k < j; k++)
          max = Math.max(max, Math.abs(length(q, atIndex(mapped, k)) - length(p, atIndex(tri, k))));
      }
    }
    const mid = seen.get("1,0,0")!,
      cap = seen.get("1,1,0")!;
    if (n > 0 && n < 1000 && !(mid[0] < 1 && mid[2] > 0 && cap[2] > 0))
      throw Error("Pocket is closed");
    if (n === 500) {
      expect(mid).toEqual([
        expect.closeTo(1 / 3, 12),
        expect.closeTo(-2 / 3, 12),
        expect.closeTo(2 / 3, 12),
      ]);
      expect(cap[2]).toBe(1);
    }
    if (n === 1000) {
      expect(mid).toEqual([0, -1, 0]);
      expect(cap).toEqual([1, -1, 0]);
    }
  }
  expect(max).toBeLessThan(1e-12);
  console.info("Waterbomb fixture seam/distance", max);
});
it("folds four neighboring Miura cells as isometries around one moving vertex", () => {
  const grid = {
    kind: "herringbone",
    origin: [0, 0],
    pitch: 1,
    band: 1,
    stagger: 0.5,
    degrees: 45,
  } as const;
  let max = 0;
  for (let n = 0; n <= 1000; n++) {
    const t = n / 1000,
      seen = new Map<string, Point>();
    for (const r of [0, 1])
      for (const c of [0, 1]) {
        const a = (r % 2) / 2,
          b = (1 - (r % 2)) / 2,
          corners: Point[] = [
            [c + a, r, 0],
            [c + a + 1, r, 0],
            [c + b + 1, r + 1, 0],
            [c + b, r + 1, 0],
          ];
        const chart = prepareChart(grid, c + 0.75, r + 0.5)(t),
          mapped = corners.map((p) => chartPoint(chart, p));
        for (const [i, p] of corners.entries()) {
          const q = atIndex(mapped, i),
            previous = seen.get(String(p));
          if (previous) max = Math.max(max, length(previous, q));
          seen.set(String(p), q);
          for (let j = 0; j < i; j++)
            max = Math.max(
              max,
              Math.abs(length(p, atIndex(corners, j)) - length(q, atIndex(mapped, j))),
            );
        }
      }
    if (n === 1000) {
      const ridge = seen.get("1.5,1,0")!;
      expect(ridge[2]).toBeCloseTo(Math.SQRT1_2, 13);
      expect(ridge[1]).toBeCloseTo(Math.sqrt(3) / 2, 13);
    }
  }
  expect(max).toBeLessThan(1e-12);
  expect(() => prepareChart({ ...grid, degrees: 89 }, 0, 0)).toThrow(/closure/);
  expect(() => prepareChart({ kind: "unknown" } as unknown as RigidField, 0, 0)).toThrow(/Unknown/);
  console.info("Miura fixture seam/distance", max);
});
