import { atIndex } from "../app/lesson/geometry";
import type { Point } from "./browser/paper-pixels";
type XY = readonly [number, number];
const slope = 0.24;
export function wingPoint(u: number, y: number, side: number, degrees = 75): Point {
  const scale = Math.hypot(1, slope),
    along = (y + 0.5 + slope * u) / scale,
    across = (u - slope * (y + 0.5)) / scale;
  if (across <= 0) return [0, y, u];
  const a = (degrees * Math.PI) / 180;
  return [
    side * across * Math.sin(a),
    -0.5 + (along - slope * across * Math.cos(a)) / scale,
    (slope * along + across * Math.cos(a)) / scale,
  ];
}
// Two outlines from the double-boat drawing before the spine is pinched.
// Clip each outline at the sloping root before projecting its standing book.
export function butterflyOutline(): Point[][] {
  const fore: XY[] = [
    [0, 0],
    [1, 0],
    [0.5, -0.5],
    [0, -0.5],
  ];
  const hind: XY[] = [
    [0, 0],
    [0.5, 0],
    [0.5, -0.29],
    [0.29, -0.71],
    [0, -1],
  ];
  return [-1, 1].flatMap((s) =>
    [fore, hind].flatMap((poly) =>
      [-1, 1].map((half) => {
        const clipped: XY[] = [];
        for (const [i, p] of poly.entries()) {
          const q = atIndex(poly, (i + 1) % poly.length),
            a = half * (p[0] - slope * (p[1] + 0.5)),
            b = half * (q[0] - slope * (q[1] + 0.5));
          if (a >= 0) clipped.push(p);
          if (a * b < 0) {
            const t = a / (a - b);
            clipped.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
          }
        }
        return clipped.map(([u, y]) => wingPoint(u, y, s));
      }),
    ),
  );
}
