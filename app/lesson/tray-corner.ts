import type { Point } from "../fold/geometry";
import type { Chart } from "./rigid-field";

export type TrayCorner = {
  kind: "tray-corner";
  center: readonly [number, number];
  outward: readonly [-1 | 1, -1 | 1];
  sector: "side" | "end" | "side-gusset" | "end-gusset";
  sideAngle: number;
  endAngle: number;
  branch: -1 | 1;
};

export function prepareTray(field: TrayCorner, corners: readonly Point[]) {
  const {
    center: [ox, oy],
    outward: [sx, sy],
    sector,
    sideAngle,
    endAngle,
    branch,
  } = field;
  if (
    ![ox, oy, sideAngle, endAngle].every(Number.isFinite) ||
    Math.abs(sx) !== 1 ||
    Math.abs(sy) !== 1 ||
    Math.abs(branch) !== 1 ||
    sideAngle <= 0 ||
    endAngle <= 0 ||
    sideAngle >= 90 ||
    endAngle >= 90 ||
    !["side", "end", "side-gusset", "end-gusset"].includes(sector)
  )
    throw Error("Invalid tray corner orientation or angle");
  for (const [x, y] of corners) {
    const u = sx * (x - ox),
      v = sy * (y - oy),
      eps = 1e-7;
    const matches =
      sector === "side"
        ? u >= -eps && v <= eps
        : sector === "end"
          ? v >= -eps && u <= eps
          : sector === "side-gusset"
            ? v >= -eps && u >= v - eps
            : u >= -eps && v >= u - eps;
    if (!matches) throw Error("Score every tray corner sector boundary");
  }
  return (p: number): Chart => {
    const a = ((p * Math.PI) / 180) * sideAngle,
      b = ((p * Math.PI) / 180) * endAngle;
    const ca = Math.cos(a),
      cb = Math.cos(b),
      sa = Math.sin(a),
      sb = Math.sin(b);
    let u: Point = [ca, 0, sa],
      v: Point = [0, cb, sb];
    if (sector === "side") v = [0, 1, 0];
    else if (sector === "end") u = [1, 0, 0];
    else {
      // The diagonal D has dot product 1 with each moving wall ray and
      // squared length 2. The sign selects one of the two circle intersections.
      const dot = sa * sb,
        inv = 1 / (1 + dot);
      const k = (branch * Math.sqrt((2 * dot) / (1 + dot))) / Math.hypot(sa * cb, ca * sb, ca * cb);
      const d: Point = [
        ca * inv - k * sa * cb,
        cb * inv - k * ca * sb,
        (sa + sb) * inv + k * ca * cb,
      ];
      if (sector === "side-gusset") v = [d[0] - ca, d[1], d[2] - sa];
      else u = [d[0], d[1] - cb, d[2] - sb];
    }
    const x: Point = [u[0], sx * sy * u[1], sx * u[2]],
      y: Point = [sx * sy * v[0], v[1], sy * v[2]];
    return {
      x,
      y,
      origin: [ox - ox * x[0] - oy * y[0], oy - ox * x[1] - oy * y[1], -ox * x[2] - oy * y[2]],
      ply: 0,
    };
  };
}
