import type { Point } from "../fold/geometry";
import { chartPoint, type Chart } from "./rigid-field";

export type Crimp = {
  /** The first two material pins point along the rib. The third establishes its transverse side. */
  frame: readonly [origin: string, along: string, side: string];
  side: 1 | -1;
  stations: readonly (readonly [distance: number, slope: number])[];
  halfAngle: number;
  hold: "left" | "spine";
  faces: readonly string[];
};

const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const minus = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function unit(p: Point): Point {
  const length = Math.hypot(...p);
  if (length < 1e-9) throw Error("Collinear crimp frame");
  return [p[0] / length, p[1] / length, p[2] / length];
}

export function prepareCrimp(crimp: Crimp, origin: Point, along: Point, sidePin: Point) {
  const y = unit(minus(along, origin)),
    side = minus(sidePin, origin),
    d = dot(side, y);
  const x = unit(
    side.map((value, i) => crimp.side * (value - d * (y[i] ?? 0))) as [number, number, number],
  );
  const frame: Chart = { origin, x, y, ply: 0 };
  const normal = chartPoint(frame, [0, 0, 1], true);
  const { stations, halfAngle, hold } = crimp;
  if (
    !Number.isFinite(halfAngle) ||
    halfAngle === 0 ||
    Math.abs(halfAngle) >= 90 ||
    !stations.length ||
    !stations.every(
      ([at, slope], i) =>
        Number.isFinite(at) &&
        Number.isFinite(slope) &&
        slope !== 0 &&
        (i === 0 || at > (stations[i - 1]?.[0] ?? at)),
    )
  )
    throw Error("Invalid reverse-fold stations or opening");
  const charts = new Map<string, (t: number) => Chart>();
  return (corners: readonly Point[]) => {
    const local = corners.map((p) => {
      const q = minus(p, origin);
      if (Math.abs(dot(q, normal)) > 1e-6)
        throw Error("Crimp packet is not planar in its own frame");
      return [dot(q, x), dot(q, y)] as const;
    });
    const cx = local.reduce((a, p) => a + p[0], 0) / local.length;
    const cy = local.reduce((a, p) => a + p[1], 0) / local.length;
    const sign = cx < 0 ? -1 : 1;
    const beyond = stations.filter(([at, slope]) => cy > at + slope * Math.abs(cx)).length;
    for (const [u, v] of local) {
      if (
        u * sign < -1e-7 ||
        stations.some(
          ([at, slope], i) => (v - at - slope * Math.abs(u)) * (i < beyond ? 1 : -1) < -1e-7,
        )
      )
        throw Error("Crimp face crosses an uncut material hinge");
    }
    const key = sign + "/" + beyond;
    const existing = charts.get(key);
    if (existing) return existing;
    let last = -1,
      cached: Chart;
    const make = (t: number): Chart => {
      if (t === last) return cached;
      const a = (Math.PI / 180) * halfAngle * t,
        s = Math.sin(a),
        c = Math.cos(a);
      function move(u: number, v: number, vector = false): Point {
        let px = u * c,
          pz = u * sign * s,
          py = v;
        // Reflect the distal segment across the plane of the two moving obliques.
        // Outer reverses ride on every proximal reverse nearer the held root.
        for (let i = beyond - 1; i >= 0; i--) {
          const st = stations[i];
          if (!st) throw Error("Missing reverse crease");
          const [station, k] = st,
            at = vector ? 0 : station;
          const h = (2 * ((py - at) * s - pz * k)) / (s * s + k * k);
          py -= h * s;
          pz += h * k;
        }
        if (hold === "left") [px, pz] = [c * px - s * pz, s * px + c * pz];
        return chartPoint(frame, [px, py, pz], vector);
      }
      const ex = move(1, 0, true),
        ey = move(0, 1, true);
      const rotated: Chart = { origin: move(0, 0), x: ex, y: ey, ply: 0 };
      function worldAxis(i: 0 | 1 | 2) {
        return chartPoint(rotated, [x[i], y[i], normal[i]], true);
      }
      const translation = chartPoint(rotated, [
        -dot(origin, x),
        -dot(origin, y),
        -dot(origin, normal),
      ]);
      cached = { origin: translation, x: worldAxis(0), y: worldAxis(1), ply: 0 };
      last = t;
      return cached;
    };
    charts.set(key, make);
    return make;
  };
}
