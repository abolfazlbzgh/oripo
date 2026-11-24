import type { Point } from "../fold/geometry";
import type { Chart } from "./rigid-field";
import type { XY } from "./flat-pattern";
const root = Math.sqrt(3),
  cosine = Math.sqrt(15) / 4,
  sine = 0.25;
export function irisSide(i: number, radius: number) {
  const a = (Math.PI * i) / 3,
    b = a + Math.PI / 6;
  const pin: XY = [radius * Math.cos(a), radius * Math.sin(a)],
    normal: XY = [Math.cos(b), Math.sin(b)],
    tangent: XY = [-normal[1], normal[0]];
  const rail: XY = [cosine * normal[0] + sine * tangent[0], cosine * normal[1] + sine * tangent[1]];
  return { pin, normal, tangent, rail };
}
const det = (a: XY, b: XY) => a[0] * b[1] - a[1] * b[0];
export function hexChart(radius: number, x: number, y: number): (p: number) => Chart {
  if (!Number.isFinite(radius) || radius <= 0) throw Error("Invalid hexagonal hub radius");
  const sides = Array.from({ length: 6 }, (_, i) => irisSide(i, radius));
  const at = (i: number) => {
    const side = sides[i % 6];
    if (!side) throw Error("Missing hexagon side");
    return side;
  };
  const local = (i: number): XY => [x - at(i).pin[0], y - at(i).pin[1]];
  const rank = (i: number) => i % 3;
  function vane(i: number, p: number) {
    const { normal, tangent } = at(i),
      h = (3 + Math.sqrt(5)) / 2;
    const u = h ** rank(i) * Math.tan((Math.PI * p) / 2),
      ca = p === 1 ? -1 : (1 - u * u) / (1 + u * u),
      sa = p === 1 ? 0 : (2 * u) / (1 + u * u);
    return (v: XY): Point => {
      const n = v[0] * normal[0] + v[1] * normal[1],
        t = v[0] * tangent[0] + v[1] * tangent[1];
      return [n * ca * normal[0] + t * tangent[0], n * ca * normal[1] + t * tangent[1], n * sa];
    };
  }
  function anchored(pin: XY, ex: Point, ey: Point, ply: number): Chart {
    return {
      x: ex,
      y: ey,
      ply,
      origin: [
        pin[0] * (1 - ex[0]) - pin[1] * ey[0],
        pin[1] * (1 - ey[1]) - pin[0] * ex[1],
        -pin[0] * ex[2] - pin[1] * ey[2],
      ],
    };
  }
  for (let i = 0; i < 6; i++) {
    const d = local(i),
      { rail, pin, normal } = at(i);
    const width = d[0] * normal[0] + d[1] * normal[1],
      along = det(rail, d) / cosine;
    if (width > 0 && along >= 0 && along <= radius)
      return (p) => {
        const apply = vane(i, p);
        return anchored(pin, apply([1, 0]), apply([0, 1]), 1 + 2 * (2 - rank(i)));
      };
  }
  for (let i = 0; i < 6; i++) {
    const k = (i + 5) % 6,
      u = at(k).rail,
      v = at(i).rail,
      d = local(i);
    if (det(u, d) > 0 && det(d, v) > 0)
      return (p) => {
        const a = vane(k, p)(u),
          b = vane(i, p)(v);
        const axis = (s: number, t: number): Point => [
          s * a[0] + t * b[0],
          s * a[1] + t * b[1],
          s * a[2] + t * b[2],
        ];
        // Map the two material rays to their independently hinged images.
        // Their common included angle is 60 degrees for the entire cycle.
        const inv = 2 / root;
        return anchored(
          at(i).pin,
          axis(v[1] * inv, -u[1] * inv),
          axis(-v[0] * inv, u[0] * inv),
          2 + 2 * (2 - Math.max(rank(i), rank(k))),
        );
      };
  }
  return () => ({ origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], ply: 0 });
}
