import { clip, crimpFacets, spinePose, type XY, type XYZ } from "./advanced-projections";
const rad = (n: number) => (n * Math.PI) / 180;
export function ternPoint([x, y]: XY, angle: number, wing: number, wrist = 0): XYZ {
  const m = Math.SQRT2 - 1,
    g = (Math.abs(x) + m * (y - 1.5)) / (1 + m * m);
  if (g > 0) {
    x -= Math.sign(x) * 2 * g;
    y -= 2 * m * g;
  }
  y = Math.min(y, 2.7 - y);
  const cheek = (y + 0.8 * Math.abs(x) - 1.35) / (1 + 0.8 ** 2);
  if (cheek > 0) {
    x -= Math.sign(x) * 2 * 0.8 * cheek;
    y -= 2 * cheek;
  }
  const sign = Math.sign(x),
    u = Math.abs(x),
    a = rad(angle);
  // Use a component parallel to the swept hinge and rotate the signed distance perpendicular to it.
  const base = [u * Math.cos(a), y, u * Math.sin(a)] as XYZ;
  function swung(p: XYZ, w: number, slope: number, degrees: number): XYZ {
    const k = Math.hypot(1, slope),
      ax: XYZ = [(slope * Math.cos(a)) / k, 1 / k, (slope * Math.sin(a)) / k];
    const delta = [p[0] - w * Math.cos(a), p[1], p[2] - w * Math.sin(a)],
      dot = ax[0] * delta[0]! + ax[1] * delta[1]! + ax[2] * delta[2]!;
    const q = rad(degrees),
      c = Math.cos(q),
      sn = Math.sin(q);
    return [0, 1, 2].map((i) => {
      const j = (i + 1) % 3,
        k = (i + 2) % 3;
      return (
        p[i]! +
        (c - 1) * (delta[i]! - dot * ax[i]!) +
        sn * (ax[j]! * delta[k]! - ax[k]! * delta[j]!)
      );
    }) as [number, number, number];
  }
  if (u > 0.39 + 0.11 * y) {
    const p = u > 0.7 - 0.2 * y ? swung(base, 0.7, -0.2, -48 * wrist) : base;
    const v = swung(p, 0.39, 0.11, 70 * wing);
    return [sign * v[0], v[1], v[2]];
  }
  if (y >= 0) return spinePose(x, y, 0.4, 0.76, 1.3, angle);
  const [px, py, pz] = spinePose(x, -y, 1.2, 3, 0.36, angle);
  return [px, -py, pz];
}
export function ternOutline(): XYZ[][] {
  const sheet: XY[] = [
    [0, -1.5],
    [3 * (1 - 1 / Math.SQRT2), 1.5 - 3 / Math.SQRT2],
    [0, 1.5],
    [-3 * (1 - 1 / Math.SQRT2), 1.5 - 3 / Math.SQRT2],
  ];
  const trimmed = clip(
    clip(sheet, ([x, y]) => 1.35 - y - 0.8 * x),
    ([x, y]) => 1.35 - y + 0.8 * x,
  );
  const body = clip(
    clip(trimmed, ([x, y]) => x + 0.39 + 0.11 * y),
    ([x, y]) => 0.39 + 0.11 * y - x,
  );
  const tail = clip(body, ([, y]) => -y).map(([x, y]): XY => [x, -y]);
  const pieces = [
    ...crimpFacets(
      clip(body, ([, y]) => y),
      0.4,
      0.76,
      1.3,
    ),
    ...crimpFacets(tail, 1.2, 3, 0.36).map((p) => p.map(([x, y]): XY => [x, -y])),
    ...[-1, 1].flatMap((s) => {
      const w = clip(trimmed, ([x, y]) => s * x - 0.39 - 0.11 * y);
      return [
        clip(w, ([x, y]) => 0.7 - 0.2 * y - s * x),
        clip(w, ([x, y]) => s * x - 0.7 + 0.2 * y),
      ];
    }),
  ];
  return pieces.map((poly) => poly.map((p) => ternPoint(p, 63, 1, 1)));
}
