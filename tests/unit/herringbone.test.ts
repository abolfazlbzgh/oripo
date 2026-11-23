import { checkPenetrations } from "./material-collisions";
import { it, expect } from "vitest";
import { herringbone as map, mapHingePlies } from "../../app/lesson/herringbone";
import { atIndex, poseAt, type Pose } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import type { Point } from "../../app/fold/geometry";
import { materialChecks, distance } from "./material-checks";
import { mapOutline } from "../browser/herringbone-outline";
materialChecks(map);
it("starts as one rectangle and matches the accordion, each oblique mark and the relief", () => {
  const rest = atIndex(map.poses, 0),
    outline = mapOutline(),
    offsets = paperLayers(map, mapHingePlies).offsets;
  let error = 0;
  function check(p: Pose, i: number, v: number, e: Point) {
    error = Math.max(error, distance(atIndex(p, v), e));
    if (error > 1e-6) throw Error("Wrong map landmark in stage " + i);
  }
  for (let i = 0; i <= 14; i++)
    for (const [v, [x, y]] of rest.entries()) {
      const folds = i <= 3 ? i : i <= 11 ? 3 : 14 - i;
      let a = x,
        b = y;
      if (folds >= 1 && b > 0.5) b = 1 - b;
      if (folds >= 2 && b > 0) b = -b;
      if (folds >= 3 && b > -0.5) b = -1 - b;
      if (i >= 4 && i <= 10 && i % 2 === 0) {
        const mark = (i - 4) / 2,
          intercept = -1.25 + mark * 0.75;
        const side = 2 * (a - intercept) - (b + 1);
        if (mark < 2 ? side < 0 : side > 0) {
          a -= (4 * side) / 5;
          b += (2 * side) / 5;
        }
      }
      check(atIndex(map.poses, i), i, v, [a, b, 0]);
    }
  for (const [f, face] of map.faces.entries())
    for (const [j, v] of face.vertices.entries())
      check(atIndex(map.poses, 15), 15, v, atIndex(atIndex(outline, f), j));
  const stack = atIndex(offsets, 3);
  for (const [i, offset] of stack.entries())
    expect(offset[2]).toBeCloseTo(Math.floor(i / 5) * 0.0007, 12);
  // Inside the folded grid each band has positive projected height and each
  // cell has strictly increasing X on both rims: the surface is a graph in XY.
  let minArea = Infinity;
  for (let k = 0; k <= 1000; k++) {
    const pose = poseAt(map, 14, k / 1000);
    for (const face of map.faces) {
      const [a, b, c, d] = face.vertices.map((v) => atIndex(pose, v)) as [
        Point,
        Point,
        Point,
        Point,
      ];
      expectBand(a, b, c, d);
      minArea = Math.min(minArea, ((b[0] - a[0] + (c[0] - d[0])) * (d[1] - a[1])) / 2);
    }
  }
  function expectBand(a: Point, b: Point, c: Point, d: Point) {
    if (!(
      b[0] > a[0] &&
      c[0] > d[0] &&
      d[1] > a[1] &&
      Math.abs(a[1] - b[1]) < 1e-9 &&
      Math.abs(c[1] - d[1]) < 1e-9
    ))
      throw Error("Crossed corrugation");
  }
  expect(error).toBeLessThan(1e-9);
  console.info("Map canonical error and minimum projected panel area", error, minArea);
});

it("avoids transverse sheet penetration during the accordion and through-ply marks", () =>
  checkPenetrations(map));
