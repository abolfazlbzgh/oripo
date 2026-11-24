import type { Point } from "../../app/fold/geometry";
import { atIndex, difference, poseAt, type CompiledLesson } from "../../app/lesson/geometry";
import { paperLayers, type HingePlies } from "../../app/lesson/drawing";
type XY = readonly [number, number];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const det = (a: XY, b: XY, c: XY) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const area = (p: XY[]) =>
  p.reduce((s, v, i) => s + det([0, 0], v, atIndex(p, (i + 1) % p.length)), 0) / 2;
function intersect(subject: XY[], clip: XY[]) {
  const boundary = area(clip) < 0 ? [...clip].reverse() : clip;
  for (const [j, a] of boundary.entries()) {
    const b = atIndex(boundary, (j + 1) % boundary.length),
      next: XY[] = [];
    for (const [i, p] of subject.entries()) {
      const q = atIndex(subject, (i + 1) % subject.length),
        u = det(a, b, p),
        v = det(a, b, q);
      if (u >= -1e-12) next.push(p);
      if (u * v < 0) {
        const t = u / (u - v);
        next.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
      }
    }
    subject = next;
    if (!subject.length) break;
  }
  return subject;
}
// A contact witness is inside the clipped material panels. Its barycentric
// coordinates stay with the same piece of paper as the sheets approach or lift.
function follow(corners: XY[], near: Point[], p: XY): Point {
  const o = atIndex(corners, 0),
    a = atIndex(near, 0);
  for (let j = 1; j + 1 < corners.length; j++) {
    const b = atIndex(corners, j),
      c = atIndex(corners, j + 1),
      d = det(o, b, c);
    if (Math.abs(d) < 1e-11) continue;
    const u = det(o, p, c) / d,
      v = det(o, b, p) / d,
      B = atIndex(near, j),
      C = atIndex(near, j + 1);
    const axis = (k: 0 | 1 | 2) => a[k] + u * (B[k] - a[k]) + v * (C[k] - a[k]);
    return [axis(0), axis(1), axis(2)];
  }
  throw Error("Degenerate contact panel");
}
function normal(points: Point[]): Point {
  const a = atIndex(points, 0);
  let best: Point = [0, 0, 0],
    length = 0;
  for (let j = 1; j + 1 < points.length; j++) {
    const n = cross(difference(atIndex(points, j), a), difference(atIndex(points, j + 1), a)),
      l = Math.hypot(...n);
    if (l > length) {
      best = n;
      length = l;
    }
  }
  if (length < 1e-11) throw Error("Degenerate contact plane");
  return [best[0] / length, best[1] / length, best[2] / length];
}
export function checkContacts(m: CompiledLesson, heights: HingePlies, ply = 0.0007) {
  const { offsets } = paperLayers(m, heights, ply);
  let overlapping = 0,
    approaches = 0;
  for (const [k, step] of m.steps.entries())
    for (const end of [false, true]) {
      const idx = k + Number(end),
        pose = atIndex(m.poses, idx),
        near = poseAt(m, k, end ? 0.9999 : 0.0001);
      const faces = m.faces.map((f) => f.vertices.map((v) => atIndex(pose, v)));
      const moving = m.faces.map((f) => f.vertices.map((v) => atIndex(near, v)));
      const shift = atIndex(offsets, idx);
      for (const [i, A] of faces.entries()) {
        const n = normal(A),
          abs = n.map(Math.abs),
          omit = abs.indexOf(Math.max(...abs)),
          origin = atIndex(A, 0);
        const project = ([x, y, z]: Point): XY =>
          omit === 0 ? [y, z] : omit === 1 ? [x, z] : [x, y];
        const a = A.map(project);
        for (let j = i + 1; j < faces.length; j++) {
          const B = atIndex(faces, j);
          if (B.some((p) => Math.abs(dot(n, difference(p, origin))) > 1e-8)) continue;
          const b = B.map(project),
            patch = intersect(a, b);
          if (patch.length < 3 || Math.abs(area(patch)) < 1e-10) continue;
          if (idx === 0) throw Error("Overlapping rest panels " + i + "/" + j);
          const q: XY = [
            patch.reduce((s, p) => s + p[0], 0) / patch.length,
            patch.reduce((s, p) => s + p[1], 0) / patch.length,
          ];
          const rank = dot(n, difference(atIndex(shift, i), atIndex(shift, j))) / ply;
          const gap = dot(
            n,
            difference(follow(a, atIndex(moving, i), q), follow(b, atIndex(moving, j), q)),
          );
          if (Math.abs(rank) < 0.1 || (Math.abs(gap) > 1e-9 && rank * gap <= 0))
            throw Error(
              step.id + " contact order at " + (end ? "landing " : "departure ") + i + "/" + j,
            );
          overlapping++;
          if (Math.abs(gap) > 1e-9) approaches++;
        }
      }
    }
  return { overlapping, approaches };
}
