import type { Point } from "../../app/fold/geometry";
import { atIndex, difference, poseAt, type CompiledLesson } from "../../app/lesson/geometry";
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function pierces(a: Point, b: Point, tri: [Point, Point, Point]) {
  const [p, q, r] = tri,
    u = difference(q, p),
    v = difference(r, p),
    normal = cross(u, v);
  const da = dot(normal, difference(a, p)),
    db = dot(normal, difference(b, p));
  if (da * db >= 0 || Math.min(Math.abs(da), Math.abs(db)) < 1e-10) return false;
  const f = da / (da - db),
    h: Point = [
      a[0] + f * (b[0] - a[0]) - p[0],
      a[1] + f * (b[1] - a[1]) - p[1],
      a[2] + f * (b[2] - a[2]) - p[2],
    ];
  const n2 = dot(normal, normal),
    s = dot(cross(h, v), normal) / n2,
    t = dot(cross(u, h), normal) / n2;
  return s > 1e-8 && t > 1e-8 && s + t < 1 - 1e-8;
}
export function checkPenetrations(box: CompiledLesson) {
  let checked = 0;
  for (let i = 0; i < box.steps.length; i++)
    for (let n = 1; n < 32; n++) {
      const pose = poseAt(box, i, n / 32);
      const triangles = box.faces.flatMap((f) =>
        f.vertices
          .slice(1, -1)
          .map(
            (v, j) =>
              [
                atIndex(pose, atIndex(f.vertices, 0)),
                atIndex(pose, v),
                atIndex(pose, atIndex(f.vertices, j + 2)),
              ] as [Point, Point, Point],
          ),
      );
      const bounds = triangles.map((tri) =>
        [0, 1, 2].map(
          (k) =>
            [
              Math.min(...tri.map((p) => atIndex(p, k))),
              Math.max(...tri.map((p) => atIndex(p, k))),
            ] as const,
        ),
      );
      for (const [a, first] of triangles.entries())
        for (let b = a + 1; b < triangles.length; b++) {
          if (
            atIndex(bounds, a).some(
              ([lo, hi], j) =>
                lo > atIndex(atIndex(bounds, b), j)[1] + 1e-8 ||
                hi < atIndex(atIndex(bounds, b), j)[0] - 1e-8,
            )
          )
            continue;
          checked++;
          const second = atIndex(triangles, b);
          for (let j = 0; j < 3; j++)
            if (
              pierces(atIndex(first, j), atIndex(first, (j + 1) % 3), second) ||
              pierces(atIndex(second, j), atIndex(second, (j + 1) % 3), first)
            )
              throw Error(`Material penetration in fold ${i + 1}, t=${n}/32, panels ${a}/${b}`);
        }
    }
  console.info(box.lessonId, "candidate triangle pairs", checked);
}
