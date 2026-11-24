// Independent silhouette construction from crease intersections and the folded spine bearings.
// No lesson, material graph, posed vertices, renderer or chart solver is imported here.
export type XY = readonly [number, number];
export type XYZ = [number, number, number];
const rad = (n: number) => (Math.PI * n) / 180;
export function clip(poly: readonly XY[], distance: (p: XY) => number): XY[] {
  const result: XY[] = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    if (!b) throw Error("Missing clipped edge");
    const h = distance(a),
      k = distance(b);
    if (h >= -1e-10) result.push(a);
    if (h * k < -1e-18)
      result.push([a[0] + ((b[0] - a[0]) * h) / (h - k), a[1] + ((b[1] - a[1]) * h) / (h - k)]);
  });
  return result;
}
export function crimpFacets(poly: readonly XY[], near: number, far: number, slope: number) {
  const faces: XY[][] = [];
  for (const side of [-1, 1]) {
    const half = clip(poly, ([u]) => side * u);
    const h = ([u, v]: XY) => v - slope * side * u;
    faces.push(
      clip(half, (p) => near - h(p)),
      clip(
        clip(half, (p) => h(p) - near),
        (p) => far - h(p),
      ),
      clip(half, (p) => h(p) - far),
    );
  }
  return faces.filter((p) => p.length >= 3);
}
export function spinePose(
  u: number,
  v: number,
  near: number,
  far: number,
  slope: number,
  angle: number,
): XYZ {
  const a = rad(angle),
    h = Math.abs(u) * Math.sin(a),
    b = 2 * Math.atan(Math.sin(a) / slope);
  const x = u * Math.cos(a),
    station = v - Math.abs(u) * slope;
  if (station <= near) return [x, v, h];
  if (station < far)
    return [
      x,
      near + (v - near) * Math.cos(b) + h * Math.sin(b),
      (v - near) * Math.sin(b) - h * Math.cos(b),
    ];
  return [x, v + (far - near) * (Math.cos(b) - 1), h + (far - near) * Math.sin(b)];
}
const ell = Math.hypot(1, 0.28);
const calyxLocal = ([x, y]: XY): XY => [(x - 1 + 0.28 * y) / ell, (y - 0.28 * (x - 1)) / ell];
export function calyxCorner(material: XY, raised: number, angle: number): XYZ {
  let [x, y] = material;
  if (x + y > 1.78) [x, y] = [1.78 - y, 1.78 - x];
  const [u, v] = calyxLocal([x, y]),
    [cu, cv, cw] = spinePose(u, v, 0.6, 0.77, 1.25, angle);
  const a = rad(angle),
    w = cu * Math.sin(a) + cw * Math.cos(a),
    uu = cu * Math.cos(a) - cw * Math.sin(a);
  x = 1 + (uu - 0.28 * cv) / ell;
  y = (0.28 * uu + cv) / ell;
  const d = (x + y - 1) / Math.SQRT2,
    r = rad(raised),
    offset = (d * (Math.cos(r) - 1) - w * Math.sin(r)) / Math.SQRT2;
  return [x + offset, y + offset, d * Math.sin(r) + w * Math.cos(r)];
}
export function calyxOutline(firstPair = 1, secondPair = 1, inner = true): XYZ[][] {
  const outline: XYZ[][] = [
    [
      [1, 0, 0],
      [0, 1, 0],
      [-1, 0, 0],
      [0, -1, 0],
    ],
  ];
  const local = (
    [
      [1, 0],
      [1, 0.78],
      [0.78, 1],
      [0, 1],
    ] as XY[]
  ).map(calyxLocal);
  for (let j = 0; j < 4; j++)
    for (const facet of crimpFacets(local, 0.6, 0.77, 1.25))
      outline.push(
        facet.map(([u, v]) => {
          const [x, y, z] = calyxCorner(
            [1 + (u - 0.28 * v) / ell, (0.28 * u + v) / ell],
            49,
            52 * (j % 2 ? secondPair : firstPair),
          );
          return (
            [
              [x, y, z],
              [-y, x, z],
              [-x, -y, z],
              [y, -x, z],
            ] as [XYZ, XYZ, XYZ, XYZ]
          )[j as 0 | 1 | 2 | 3];
        }),
      );
  for (let j = 0; j < 4; j++) {
    const a = inner ? rad(j % 2 ? 65 : 78) : 0,
      d = 0.46;
    outline.push(
      (
        [
          [d, -d, 0],
          [d, d, 0],
          [d * (1 - Math.cos(a)), 0, d * Math.sin(a)],
        ] as XYZ[]
      ).map(
        ([x, y, z]) =>
          (
            [
              [x, y, z],
              [-y, x, z],
              [-x, -y, z],
              [y, -x, z],
            ] as [XYZ, XYZ, XYZ, XYZ]
          )[j as 0 | 1 | 2 | 3],
      ),
    );
  }
  return outline;
}
