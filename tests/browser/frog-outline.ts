import { atIndex } from "../../app/lesson/geometry";
import type { Point } from "./paper-pixels";
type XY = [number, number];
// Independent silhouette of the folded cap, shoulders, feet and rear boat in
// the flat belly view. Split the rear polygons at the two physical spring bars.
export function frogOutline(): Point[][] {
  const head: Point[][] = [
    [
      [-0.25, 0, 0],
      [0.25, 0, 0],
      [0.25, 0.25, 0],
      [0, 0.5, 0],
      [-0.25, 0.25, 0],
    ],
  ];
  const rear: XY[][] = [
    [
      [-0.25, 0],
      [0.25, 0],
      [0.25, 0.25],
      [-0.25, 0.25],
    ],
  ];
  for (const s of [-1, 1]) {
    head.push([
      [0, 0, 0],
      [s * 0.3, 0.4, 0],
      [s * 0.125, 0.375, 0],
    ]);
    rear.push(
      [
        [0, 0],
        [s / 3, 1 / 6],
        [s * 0.25, 0.25],
        [0, 0.25],
      ],
      [
        [0, 0],
        [s * 0.3, 0.4],
        [s / 3, 1 / 6],
      ],
    );
  }
  const a = Math.PI / 10,
    b = (14 * Math.PI) / 15;
  for (const poly of rear)
    for (const far of [false, true]) {
      const clipped: XY[] = [];
      for (const [i, p] of poly.entries()) {
        const n = atIndex(poly, (i + 1) % poly.length);
        if (far ? p[1] >= 0.125 : p[1] <= 0.125) clipped.push(p);
        if ((p[1] - 0.125) * (n[1] - 0.125) < 0)
          clipped.push([p[0] + ((n[0] - p[0]) * (0.125 - p[1])) / (n[1] - p[1]), 0.125]);
      }
      if (clipped.length >= 3)
        head.push(
          clipped.map(([x, l]) => [
            x,
            Math.min(l, 0.125) * Math.cos(a) + Math.max(l - 0.125, 0) * Math.cos(b),
            Math.min(l, 0.125) * Math.sin(a) + Math.max(l - 0.125, 0) * Math.sin(b),
          ]),
        );
    }
  return head;
}
