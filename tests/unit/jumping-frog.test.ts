import { fixture } from "../model-fixture";
import { expect, it } from "vitest";
import { atIndex, compileLesson, poseAt } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import type { Point } from "../../app/fold/geometry";
import { materialChecks, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";

const m = fixture("jumping-frog").model;
const frogPattern = fixture("jumping-frog").pattern;
const frogHingePlies = fixture("jumping-frog").presentation.hingePlies;
const frogPlyThickness = fixture("jumping-frog").presentation.plyThickness ?? 0.0007;
materialChecks(m);
it("checks the square, every crease endpoint, four feet, two open pockets and the return pleat", () => {
  const rest = atIndex(m.poses, 0);
  const v = (x: number, y: number) => {
    const i = rest.findIndex((p) => Math.abs(x - p[0]) < 1e-8 && Math.abs(y - p[1]) < 1e-8);
    if (i < 0) throw Error("Missing probe " + x + "," + y);
    return i;
  };
  let worst = 0;
  const probe = (stage: number, x: number, y: number, end: Point) => {
    const error = distance(atIndex(atIndex(m.poses, stage), v(x, y)), end);
    if (error > 1e-6)
      throw Error(
        "Wrong stage " +
          stage +
          " at " +
          x +
          "," +
          y +
          " actual " +
          atIndex(atIndex(m.poses, stage), v(x, y)) +
          " expected " +
          end,
      );
    worst = Math.max(worst, error);
  };
  const boundary = m.edges.filter((e) => e.faces.length === 1);
  expect(
    boundary.reduce((sum, e) => sum + distance(atIndex(rest, e.a), atIndex(rest, e.b)), 0),
  ).toBeCloseTo(8, 12);
  expect(rest.length - m.edges.length + m.faces.length).toBe(1);
  probe(1, 1, 1, [0, 1, 0]);
  probe(2, -0.5, 1, [0.5, 0, 0]);
  probe(3, -0.5, 1, [-0.5, 1, 0]);
  probe(4, 0.5, 1, [-0.5, 0, 0]);
  probe(5, 0.5, 1, [0.5, 1, 0]);
  probe(6, 0.5, 1, [0.5, 0, 0]);
  probe(7, 0.5, 1, [0.5, 1, 0]);
  const elevations = [Math.PI / 10, (14 * Math.PI) / 15];
  for (const s of [-1, 1]) {
    probe(8, s * 0.5, 0.5, [0, 0, 0]);
    probe(8, s * 0.5, 1, [s * 0.5, 0, 0]);
    probe(9, s * 0.5, 1, [0, 0.5, 0]);
    probe(10, s * 0.5, 1, [s * 0.3, 0.4, 0]);
    probe(11, s * 0.5, -1, [s * 0.5, 0, 0]);
    probe(12, s * 0.5, -1, [0, 0, 0]);
    probe(13, s * 0.25, -0.5, [s * 0.25, 0, 0]);
    probe(14, s * 0.25, -0.5, [0, -0.25, 0]);
    probe(15, s * 0.25, -0.5, [s * 0.25, 0, 0]);
    const opened = poseAt(m, 15, 0.5);
    expect(atIndex(opened, v(s * 0.5, -0.25))[2]).toBeCloseTo(Math.SQRT2 / 8, 12);
    expect(atIndex(opened, v(s * 0.5, -0.5))[2]).toBeCloseTo(Math.SQRT2 / 6, 12);
    const pin = atIndex(opened, v(s * 0.25, -0.25)),
      rim = atIndex(opened, v(s * 0.5, -0.25));
    expect(((rim[2] - pin[2]) * 0.25 * 0.25) / 6).toBeCloseTo(Math.SQRT2 / 768, 12);
    probe(16, s * 0.5, -0.5, [s * 0.5, 0, 0]);
    probe(17, s * 0.5, -0.5, [s * 0.3, -0.4, 0]);
    probe(18, s * 0.5, -0.5, [s * 0.3, 0.4, 0]);
    probe(19, s * 0.5, -0.5, [s * 0.3, 0.125 - (0.275 * Math.sqrt(3)) / 2, 0.1375]);
    const [a, b] = elevations as [number, number];
    probe(20, s * 0.5, -0.5, [
      s * 0.3,
      0.125 * Math.cos(a) + 0.275 * Math.cos(b),
      0.125 * Math.sin(a) + 0.275 * Math.sin(b),
    ]);
    probe(20, s * 0.5, 1, [s * 0.3, 0.4, 0]);
  }
  const levels = atIndex(paperLayers(m, frogHingePlies, frogPlyThickness).offsets, 8);
  const headPlies = new Set<number>();
  m.faces.forEach((f, i) => {
    if (f.vertices.every((k) => atIndex(rest, k)[1] >= 0))
      headPlies.add(Math.round(atIndex(levels, i)[2] / frogPlyThickness));
  });
  expect([...headPlies].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  const landed = atIndex(paperLayers(m, frogHingePlies, frogPlyThickness).offsets, 16);
  const flat = atIndex(m.poses, 16);
  for (const s of [-1, 1])
    for (const [x, y, count] of [
      [0.38, -0.053, 8],
      [0.16, -0.093, 16],
    ] as const) {
      const hits = m.faces.flatMap((f, i) => {
        const poly = f.vertices.map((v) => atIndex(flat, v));
        const signs = poly.map((p, j) => {
          const q = atIndex(poly, (j + 1) % poly.length);
          return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (s * x - p[0]);
        });
        if (!signs.every((d) => d > 1e-9) && !signs.every((d) => d < -1e-9)) return [];
        return [atIndex(landed, i)[2] / frogPlyThickness];
      });
      expect(hits).toHaveLength(count);
      hits.sort((a, b) => a - b).forEach((depth, index) => expect(depth).toBeCloseTo(index, 9));
    }
  const bad = structuredClone(frogPattern);
  const regions = atIndex(bad.steps, 15).regions;
  if (!regions) throw Error("Missing rear pocket packets");
  Object.assign(atIndex(regions, 0), { faces: atIndex(regions, 1).faces });
  expect(() => compileLesson(bad)).toThrow(/packet|seam/);
  console.info(
    "Frog canonical landmark error",
    worst,
    "pocket rim height",
    Math.SQRT2 / 8,
    "spring clearance",
    0.125 * Math.sin(Math.PI / 10),
  );
});
it(
  "keeps the head, paired pocket walls and hind-leg pleat free of transverse penetration",
  () => checkPenetrations(m),
  60000,
);
