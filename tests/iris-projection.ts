import { clip, type XY, type XYZ } from "./advanced-projections";
const skew = Math.atan(1 / Math.sqrt(15)),
  rho = 0.6;
const angle = (i: number) => (i * Math.PI) / 3;
const ray = (a: number): XY => [Math.cos(a), Math.sin(a)];
const pin = (j: number): XY => [rho * Math.cos(angle(j)), rho * Math.sin(angle(j))];
const normal = (j: number) => angle(j) + Math.PI / 6;
const dot = (p: XY, q: XY) => p[0] * q[0] + p[1] * q[1];
const det = (p: XY, q: XY) => p[0] * q[1] - p[1] * q[0];
const diff = (p: XY, q: XY): XY => [p[0] - q[0], p[1] - q[1]];
function rotateSide(p: XY, j: number, t: number): XYZ {
  const a = normal(j),
    base = pin(j),
    n = ray(a),
    distance = dot(diff(p, base), n);
  // Three physical vane inclinations, measured relative to the fixed plane of the hub.
  const k = ([1, (3 + Math.sqrt(5)) / 2, (7 + 3 * Math.sqrt(5)) / 2] as const)[
    ((j + 6) % 3) as 0 | 1 | 2
  ];
  const theta = t === 1 ? Math.PI : 2 * Math.atan(k * Math.tan((t * Math.PI) / 2));
  return [
    p[0] + n[0] * distance * (Math.cos(theta) - 1),
    p[1] + n[1] * distance * (Math.cos(theta) - 1),
    distance * Math.sin(theta),
  ];
}
export function irisPolygons(t: number) {
  const outer = Array.from({ length: 6 }, (_, i) => ray(angle(i))),
    hub = outer.map(([x, y]): XYZ => [rho * x, rho * y, 0]);
  const polygons: { flat: XY[]; posed: XYZ[]; at: (p: XY) => XYZ }[] = [
    { flat: hub.map(([x, y]) => [x, y]), posed: hub, at: ([x, y]) => [x, y, 0] },
  ];
  for (let j = 0; j < 6; j++) {
    const a = pin(j),
      b = pin(j + 1),
      r = ray(normal(j) + skew),
      n = ray(normal(j));
    const strip = clip(
      clip(
        clip(outer, (p) => dot(diff(p, a), n)),
        (p) => det(r, diff(p, a)),
      ),
      (p) => -det(r, diff(p, b)),
    );
    const at = (p: XY) => rotateSide(p, j, t);
    polygons.push({ flat: strip, posed: strip.map(at), at });
    const lower = ray(normal(j - 1) + skew);
    const sector = clip(
      clip(outer, (p) => det(lower, diff(p, a))),
      (p) => det(diff(p, a), r),
    );
    const left = rotateSide([a[0] + lower[0], a[1] + lower[1]], j - 1, t),
      right = rotateSide([a[0] + r[0], a[1] + r[1]], j, t);
    const gusset = (p: XY): XYZ => {
      const delta = diff(p, a),
        length = Math.hypot(...delta),
        bearing = Math.atan2(delta[1], delta[0]);
      const l = (length * Math.sin(normal(j) + skew - bearing)) / Math.sin(Math.PI / 3),
        h = (length * Math.sin(bearing - normal(j - 1) - skew)) / Math.sin(Math.PI / 3);
      return [
        a[0] + l * (left[0] - a[0]) + h * (right[0] - a[0]),
        a[1] + l * (left[1] - a[1]) + h * (right[1] - a[1]),
        l * left[2] + h * right[2],
      ];
    };
    polygons.push({ flat: sector, posed: sector.map(gusset), at: gusset });
  }
  return polygons;
}
