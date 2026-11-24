import type { Point } from "../fold/geometry";
import type { Chart } from "./rigid-field";

export type BoatPocket = {
  kind: "boat-pocket";
  center: readonly [number, number];
  frame?: readonly [origin: string, alongX: string, towardY: string];
  inward: 1 | -1;
  outward: 1 | -1;
  sector: "wall" | "wing" | "bridge";
  landingPly: number;
};

// The folded gate occupies u >= 0. The wall rotates its outward v ray.
// Across the loose packet, u-v stays fixed and u+v travels on its circle.
export function prepareBoat(field: BoatPocket, corners: readonly Point[]): (p: number) => Chart {
  const {
    center: [ox, oy],
    inward,
    outward,
    sector,
    landingPly,
  } = field;
  if (
    ![ox, oy, landingPly].every(Number.isFinite) ||
    Math.abs(inward) !== 1 ||
    Math.abs(outward) !== 1 ||
    !["wall", "wing", "bridge"].includes(sector)
  )
    throw Error("Invalid double-boat frame or sector");
  for (const [x, y] of corners) {
    const u = inward * (x - ox),
      v = outward * (y - oy);
    if (
      u < -1e-7 ||
      (sector === "wall" && v < -1e-7) ||
      (sector === "wing" && Math.abs(v) > u + 1e-7) ||
      (sector === "bridge" && v < u - 1e-7)
    )
      throw Error("Double-boat packet crosses its declared material sector");
  }
  return (p) => {
    const a = Math.PI * p,
      c = p === 1 ? -1 : Math.cos(a),
      s = p === 1 ? 0 : Math.sin(a);
    // Its dot product with the rotating wall ray must be one. The larger
    // half-angle root opens the gate on the exposed side of the wall.
    const g = 2 * Math.atan2((Math.SQRT2 + 1) * Math.sin(a / 2), Math.cos(a / 2));
    const k = p === 1 ? -1 : Math.cos(g),
      z = p === 1 ? 0 : Math.SQRT2 * Math.sin(g);
    let u: Point = [1, 0, 0],
      v: Point = [0, c, s];
    if (sector === "wing") {
      u = [(k + 1) / 2, (k - 1) / 2, z / 2];
      v = [(k - 1) / 2, (k + 1) / 2, z / 2];
    }
    if (sector === "bridge") u = [k, k - c, z - s];
    const x: Point = [u[0], inward * outward * u[1], inward * u[2]],
      y: Point = [inward * outward * v[0], v[1], outward * v[2]];
    return {
      x,
      y,
      origin: [ox - x[0] * ox - y[0] * oy, oy - x[1] * ox - y[1] * oy, -x[2] * ox - y[2] * oy],
      ply: landingPly,
    };
  };
}
