import { expect, it } from "vitest";
import { calyx as m, calyxHinges } from "../../app/lesson/calyx";
import { atIndex } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { checkPenetrations } from "./material-collisions";
import { checkSheet, materialChecks, distance } from "./material-checks";
import { calyxCorner, type XY } from "../advanced-projections";
import { poseAt } from "../../app/lesson/geometry";
materialChecks(m);
it("retains four doubled hems around an open diamond receptacle", () => {
  const rest = atIndex(m.poses, 0),
    final = atIndex(m.poses, m.steps.length);
  checkSheet(m, 8, 8 * Math.SQRT2);
  const offsets = atIndex(paperLayers(m, calyxHinges).offsets, m.steps.length);
  expect(offsets.some((p) => Math.hypot(...p) > 0.00069)).toBe(true);
  for (const [i, p] of rest.entries()) {
    if (Math.abs(Math.abs(p[0]) + Math.abs(p[1]) - 1) < 1e-8)
      expect(distance(atIndex(final, i), p)).toBeLessThan(1e-12);
  }
});
it("keeps the four calyx pockets and their doubled lips clear", () => checkPenetrations(m), 60000);
it("tracks every point of all four turning lips against the independently constructed spine bearings", () => {
  const rest = atIndex(m.poses, 0);
  let worst = 0;
  for (const step of [4, 5])
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = poseAt(m, step, f);
      for (const [i, m] of rest.entries()) {
        const gx = Math.sign(m[0]) * Math.min(Math.abs(m[0]), 2 - Math.abs(m[0])),
          gy = Math.sign(m[1]) * Math.min(Math.abs(m[1]), 2 - Math.abs(m[1]));
        if (Math.abs(gx) + Math.abs(gy) < 1 + 1e-8) continue;
        const j = gx >= 0 ? (gy >= 0 ? 0 : 3) : gy >= 0 ? 1 : 2;
        const p = atIndex<XY>(
          [
            [gx, gy],
            [gy, -gx],
            [-gx, -gy],
            [-gy, gx],
          ],
          j,
        );
        const t = j % 2 === 0 ? (step === 4 ? f : 1) : step === 4 ? 0 : f;
        const [x, y, z] = calyxCorner(p, 49, 52 * t);
        const q = atIndex<readonly [number, number, number]>(
          [
            [x, y, z],
            [-y, x, z],
            [-x, -y, z],
            [y, -x, z],
          ],
          j,
        );
        worst = Math.max(worst, distance(atIndex(pose, i), q));
      }
    }
  const rim = calyxCorner([1, 1], 49, 52);
  expect(worst).toBeLessThan(1e-10);
  expect(rim[2]).toBeCloseTo(0.245520706329, 10);
  for (const [i, p] of rest.entries())
    if (Math.abs(p[0]) === 2 || Math.abs(p[1]) === 2)
      expect(atIndex(atIndex(m.poses, m.steps.length), i)[2]).toBeCloseTo(
        0.46 * Math.sin((Math.PI * (p[0] ? 78 : 65)) / 180),
        12,
      );
  console.info(
    "calyx landmark residual",
    worst,
    "hemmed corner",
    rim,
    "opposite corner gap",
    2 * Math.hypot(rim[0], rim[1]),
  );
});
it("counts the four contacted plies across a folded rim before the outer petals rise", () => {
  const levels = atIndex(paperLayers(m, calyxHinges).offsets, 2),
    pose = atIndex(m.poses, 2);
  const hit = m.faces.flatMap((face, i) => {
    const poly = face.vertices.map((v) => atIndex(pose, v));
    const side = poly.map((a, j) => {
      const b = atIndex(poly, (j + 1) % poly.length);
      return (b[0] - a[0]) * (0.84 - a[1]) - (b[1] - a[1]) * (0.87 - a[0]);
    });
    return side.every((d) => d > 1e-9) || side.every((d) => d < -1e-9)
      ? [Math.round(atIndex(levels, i)[2] / 0.0007)]
      : [];
  });
  expect(hit.sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
});
