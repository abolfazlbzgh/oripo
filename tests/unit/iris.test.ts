import { fixture } from "../model-fixture";
import type { Point } from "../../app/fold/geometry";
import { expect, it } from "vitest";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { checkSheet, materialChecks, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";
import { irisPolygons } from "../iris-projection";

const m = fixture("hex-iris", "tests/fixtures/hex-iris").model;
const irisHinges = fixture("hex-iris", "tests/fixtures/hex-iris").presentation.hingePlies;
it("locates the hexagon, all vane edges and the gusset corners independently", () => {
  const k = m.steps.length - 2,
    rest = atIndex(m.poses, 0);
  let worst = 0;
  for (const t of [0.25, 0.5, 0.75, 1, 0.26]) {
    const pose = poseAt(m, k, t);
    for (const { flat, posed } of irisPolygons(t))
      flat.forEach((p, j) => {
        const id = rest.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-8);
        expect(id).toBeGreaterThanOrEqual(0);
        worst = Math.max(worst, distance(atIndex(posed, j), atIndex(pose, id)));
      });
  }
  console.info("iris landmark residual", worst);
  expect(worst).toBeLessThan(1e-12);
});
materialChecks(m);
it("closes the hexagon flat and reopens the exact material and ply trajectory", () => {
  const n = m.steps.length - 1;
  checkSheet(m, (3 * Math.sqrt(3)) / 2, 6);
  const { offsets, foldOffsets } = paperLayers(m, irisHinges);
  let worst = 0;
  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000,
      s = 1 - 0.74 * t,
      forward = poseAt(m, n - 1, s),
      back = poseAt(m, n, t);
    back.forEach((p, j) => {
      worst = Math.max(worst, distance(p, atIndex(forward, j)));
    });
  }
  const a = foldOffsets(atIndex(offsets, n - 1), n - 1, 0.26),
    b = atIndex(offsets, n + 1);
  expect(b).toEqual(a);
  expect(worst).toBeLessThan(1e-12);
  expect(Math.max(...atIndex(m.poses, n).map((p) => Math.abs(p[2])))).toBeLessThan(1e-12);
  console.info(
    "iris reopening residual",
    worst,
    "relief height",
    Math.max(...atIndex(m.poses, n + 1).map((p) => p[2])),
  );
});
it(
  "keeps all six moving gussets clear of the hub and each other",
  () => checkPenetrations(m),
  60000,
);

it("orders the contacting vanes and gussets on the same side as the incoming paper", () => {
  const k = m.steps.length - 2,
    close = atIndex(m.poses, k + 1),
    approach = poseAt(m, k, 0.9999),
    levels = atIndex(paperLayers(m, irisHinges).offsets, k + 1);
  let hits = 0;
  for (let i = -24; i <= 24; i++)
    for (let j = -24; j <= 24; j++) {
      const x = (i + 0.37) / 40,
        y = (j + 0.29) / 40;
      const stack = m.faces
        .flatMap((f, face) => {
          const points = f.vertices.map((v) => atIndex(close, v));
          const cross = points.map((a, k) => {
            const b = atIndex(points, (k + 1) % points.length);
            return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
          });
          if (!cross.every((c) => c > 1e-7) && !cross.every((c) => c < -1e-7)) return [];
          const a = atIndex(points, 0),
            b = atIndex(points, 1);
          const l = points.findIndex(
            (p) => Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) > 1e-8,
          );
          const c = atIndex(points, l),
            d = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          const u = ((x - a[0]) * (c[1] - a[1]) - (y - a[1]) * (c[0] - a[0])) / d,
            v = ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / d;
          const h = (i: number) => atIndex(approach, atIndex(f.vertices, i))[2];
          return [
            {
              face,
              level: Math.round(atIndex(levels, face)[2] / 0.0007),
              z: (1 - u - v) * h(0) + u * h(1) + v * h(l),
            },
          ];
        })
        .sort((a, b) => a.z - b.z);
      for (let s = 1; s < stack.length; s++) {
        const lower = atIndex(stack, s - 1),
          upper = atIndex(stack, s);
        hits++;
        if (upper.level <= lower.level)
          throw Error("Contact inversion " + JSON.stringify({ x, y, lower, upper }));
      }
    }
  expect(hits).toBeGreaterThan(1000);
  console.info("iris ordered contact pairs", hits);
});

it("uses the published mountain and valley senses on each finite rail", () => {
  const rest = atIndex(m.poses, 0);
  const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  function cross(a: Point, b: Point): Point {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  for (const f of [0.25, 0.5, 0.75]) {
    const pose = poseAt(m, m.steps.length - 2, f);
    const normals = m.faces.map((face) => {
      const points = face.vertices.map((v) => atIndex(pose, v)),
        sum = [0, 0, 0] as [number, number, number];
      points.forEach((p, i) => {
        const area = cross(p, atIndex(points, (i + 1) % points.length));
        sum[0] += area[0];
        sum[1] += area[1];
        sum[2] += area[2];
      });
      return sum;
    });
    for (const id of atIndex(m.steps, m.steps.length - 2).guides) {
      const pins = m.creases.get(id);
      if (!pins) throw Error("Missing signed rail " + id);
      const p = atIndex(rest, pins[0]),
        ab = sub(atIndex(rest, pins[1]), p);
      const within = (i: number) => {
        const v = sub(atIndex(rest, i), p),
          along = dot(v, ab);
        return (
          Math.hypot(...cross(v, ab)) < 1e-9 && along >= -1e-10 && along <= dot(ab, ab) + 1e-10
        );
      };
      const edges = m.edges.filter((e) => e.faces.length === 2 && within(e.a) && within(e.b));
      expect(edges.length, id).toBeGreaterThan(0);
      const [, sector, rail] = id.split("-");
      const rank = Number(sector) % 3;
      const valley = id.startsWith("hub-edge") || rank === 0 || (rank === 1 && rail === "1");
      for (const e of edges) {
        const l = atIndex(e.faces, 0),
          r = atIndex(e.faces, 1),
          face = atIndex(m.faces, l);
        const forward =
          atIndex(face.vertices, (face.vertices.indexOf(e.a) + 1) % face.vertices.length) === e.b;
        const axis = sub(atIndex(pose, e.b), atIndex(pose, e.a));
        const signed =
          dot(axis, cross(atIndex(normals, r), atIndex(normals, l))) * (forward ? 1 : -1);
        expect(Math.sign(signed), id).toBe(valley ? 1 : -1);
      }
    }
  }
});
