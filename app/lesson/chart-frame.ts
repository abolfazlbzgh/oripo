import type { Point } from "../fold/geometry";
import { chartPoint, type Chart } from "./rigid-field";

const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const subtract = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function unit(v: Point): Point {
  const length = Math.hypot(...v);
  if (!(length > 1e-6)) throw Error("Coincident or collinear chart frame pins");
  return [v[0] / length, v[1] / length, v[2] / length];
}

// The third pin selects the positive half-plane. Normalize both rays before
// measuring their cross product so the angular conditioning is scale independent.
export function chartFrame(origin: Point, along: Point, toward: Point) {
  const x = unit(subtract(along, origin));
  const normal = unit(cross(x, unit(subtract(toward, origin))));
  const y = cross(normal, x);
  const basis: Chart = { origin, x, y, ply: 0 };
  const localVector = (v: Point): Point => [dot(x, v), dot(y, v), dot(normal, v)];
  const localPoint = (p: Point) => localVector(subtract(p, origin));
  const offset = localPoint([0, 0, 0]);
  const ex = localVector([1, 0, 0]),
    ey = localVector([0, 1, 0]);
  return {
    localPoint,
    transport(c: Chart): Chart {
      const vector = (v: Point) => chartPoint(basis, chartPoint(c, v, true), true);
      return {
        origin: chartPoint(basis, chartPoint(c, offset)),
        x: vector(ex),
        y: vector(ey),
        ply: c.ply,
        plyNormal: normal,
      };
    },
  };
}
