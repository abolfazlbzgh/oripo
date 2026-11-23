import type { Point } from "../fold/geometry";

export type RigidField =
  | {
      kind: "herringbone";
      origin: readonly [number, number];
      pitch: number;
      band: number;
      stagger: number;
      degrees: number;
    }
  | { kind: "waterbomb"; center: readonly [number, number]; radius: number };

// Each chart gives the images of the planar x and y unit vectors. Their cross
// product transports thickness offsets without feeding them into the material.
export type Chart = { origin: Point; x: Point; y: Point; ply: number };
export function chartPoint(chart: Chart, point: Point, vector = false): Point {
  const [a, b, c] = chart.x,
    [d, e, f] = chart.y,
    [x, y, z] = point;
  const origin = vector ? ([0, 0, 0] as const) : chart.origin;
  return [
    origin[0] + a * x + d * y + (b * f - c * e) * z,
    origin[1] + b * x + e * y + (c * d - a * f) * z,
    origin[2] + c * x + f * y + (a * e - b * d) * z,
  ];
}
const identity: Chart = { origin: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], ply: 0 };
function anchored(
  x: Point,
  y: Point,
  center: readonly [number, number],
  destination: Point,
  ply = 0,
): Chart {
  const [a, b] = center;
  return {
    x,
    y,
    ply,
    origin: [
      destination[0] - x[0] * a - y[0] * b,
      destination[1] - x[1] * a - y[1] * b,
      destination[2] - x[2] * a - y[2] * b,
    ],
  };
}

export function prepareChart(field: RigidField, cx: number, cy: number): (t: number) => Chart {
  if (field.kind === "waterbomb") {
    const {
      center: [ox, oy],
      radius,
    } = field;
    if (![ox, oy, radius].every(Number.isFinite) || radius <= 0)
      throw Error("Invalid waterbomb square");
    const x = cx - ox,
      y = cy - oy,
      side = Math.sign(x);
    if (y < -Math.abs(x)) return () => identity;
    if (Math.abs(x) > radius + 1e-8 || Math.abs(y) > radius + 1e-8)
      throw Error("Panel outside waterbomb square");
    return (t) => {
      const cosine = t === 1 ? -1 : Math.cos(Math.PI * t),
        sine = t === 1 ? 0 : Math.sin(Math.PI * t);
      const upper = y > Math.abs(x),
        north = y > 0;
      const top: Point = [0, cosine, sine];
      if (upper) return anchored([1, 0, 0], top, [ox, oy], [ox, oy, 0], 3);
      // Two unit triangles meet on the side midpoint. Its distances to the
      // center and to both moving boundary corners fix the inward branch.
      const h = (1 - cosine) / 2,
        k = 1 / (1 + h);
      const ex: Point = [(1 - h) * k, -side * 2 * h * k, side * sine * k];
      const ey: Point = north
        ? [side * (1 - ex[0]), cosine - side * ex[1], sine - side * ex[2]]
        : [side * (ex[0] - 1), 1 + side * ex[1], side * ex[2]];
      return anchored(ex, ey, [ox, oy], [ox, oy, 0], north ? 2 : 1);
    };
  }
  if (field.kind !== "herringbone") throw Error("Unknown rigid field");
  const {
    origin: [ox, oy],
    pitch,
    band,
    stagger,
    degrees,
  } = field;
  if (
    ![ox, oy, pitch, band, stagger, degrees].every(Number.isFinite) ||
    pitch <= 0 ||
    band <= 0 ||
    stagger <= 0 ||
    degrees <= 0 ||
    degrees >= 90 ||
    stagger * Math.tan((degrees * Math.PI) / 180) >= band
  )
    throw Error("Invalid herringbone grid or closure");
  const row = Math.floor((cy - oy) / band),
    oddRow = Math.abs(row % 2),
    direction = 1 - 2 * oddRow;
  const signed = direction * stagger,
    offset = oddRow * stagger;
  const baseY = oy + row * band,
    col = Math.floor((cx - ox - offset - ((cy - baseY) * signed) / band) / pitch);
  const oddCol = Math.abs(col % 2),
    baseX = ox + col * pitch + offset;
  return (t) => {
    const a = (t * degrees * Math.PI) / 180,
      c = Math.cos(a),
      s = Math.sin(a);
    const rise = Math.sqrt(band * band - ((stagger * s) / c) ** 2);
    const ex: Point = [c, 0, (1 - 2 * oddCol) * s];
    const ey: Point = [(signed * (1 / c - c)) / band, rise / band, (-signed * ex[2]) / band];
    return anchored(
      ex,
      ey,
      [baseX, baseY],
      [(ox + col * pitch) * c + offset / c, (baseY * rise) / band, oddCol * pitch * s],
    );
  };
}
