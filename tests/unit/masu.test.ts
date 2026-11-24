import { fixture } from "../model-fixture";
import { checkPenetrations } from "./material-collisions";
import { paperLayers } from "../../app/lesson/drawing";
import { commandLesson, sampleLesson, initialLessonMotion } from "../../app/lesson/playback";
import { it, expect } from "vitest";
import { atIndex, compileLesson, difference, poseAt, tolerance } from "../../app/lesson/geometry";
import type { Point } from "../../app/fold/geometry";

const masuHingePlies = fixture("masu-box").presentation.hingePlies;
const box = fixture("masu-box").model;
const masuPattern = fixture("masu-box").pattern;

const rest = atIndex(box.poses, 0);
const distance = (a: Point, b: Point) => Math.hypot(...difference(a, b));
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const points = (ids: readonly number[], pose: readonly Point[]) =>
  ids.map((v) => atIndex(pose, v)) as [Point, Point, Point];

it("covers a square of area eight, with one complete rim and an open lined box", () => {
  const area = box.faces.reduce((sum, f) => {
    const [a, b, c] = points(f.vertices, rest);
    return sum + cross(difference(b, a), difference(c, a))[2] / 2;
  }, 0);
  expect(area).toBe(8);
  const boundary = box.edges.filter((e) => e.faces.length === 1);
  expect(
    boundary.reduce((sum, e) => sum + distance(atIndex(rest, e.a), atIndex(rest, e.b)), 0),
  ).toBeCloseTo(8 * Math.SQRT2, 10);
  expect(rest.length - box.edges.length + box.faces.length).toBe(1);
  expect(box.steps).toHaveLength(18);
  const end = atIndex(box.poses, box.steps.length);
  let worst = 0;
  for (const [v, [x0, y0]] of rest.entries()) {
    const x = Math.sign(x0) * Math.min(Math.abs(x0), 2 - Math.abs(x0)),
      s = Math.sign(y0),
      y = Math.abs(y0);
    const overSide = Math.max(0, Math.abs(x) - 0.5),
      overEnd = Math.max(0, y - 0.5);
    const finalX = Math.sign(x) * (Math.min(Math.abs(x), 0.5) - Math.min(overSide, overEnd));
    const finalY = s * (y > 1.5 ? 2 - y : Math.min(y, 0.5));
    const finalZ = y > 1 ? Math.max(0, 1.5 - y) : Math.max(overSide, overEnd);
    worst = Math.max(worst, distance(atIndex(end, v), [finalX, finalY, finalZ]));
  }
  expect(worst).toBeLessThan(tolerance);
  for (const face of box.faces) {
    const ps = points(face.vertices, end);
    expect(
      ps.every((p) => Math.abs(p[2]) < tolerance) ||
        [0, 1].some((axis) =>
          [-0.5, 0.5].some((wall) =>
            ps.every((p) => Math.abs(atIndex(p, axis) - wall) < tolerance),
          ),
        ),
    ).toBe(true);
  }
  for (const [x, y] of [
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
  ]) {
    const tip = rest.findIndex((p) => p[0] === x && p[1] === y);
    expect(end[tip]).toEqual([0, 0, 0]);
  }
  console.log(
    "Masu final landmark error",
    worst,
    "vertices/edges/faces",
    rest.length,
    box.edges.length,
    box.faces.length,
  );
});

it("keeps panel lengths and both moving corner traces through all eighteen folds", () => {
  let rigid = 0,
    seam = 0,
    hinge = 0,
    endpoint = 0;
  const edges = box.edges.map((e) => ({
    ...e,
    length: distance(atIndex(rest, e.a), atIndex(rest, e.b)),
  }));
  for (const [i, step] of box.steps.entries()) {
    expect(poseAt(box, i, 0)).toBe(box.poses[i]);
    expect(poseAt(box, i, 1)).toBe(box.poses[i + 1]);
    for (let n = 0; n <= 1000; n++) {
      const t = n / 1000,
        pose = poseAt(box, i, t);
      for (const e of edges)
        rigid = Math.max(
          rigid,
          Math.abs(distance(atIndex(pose, e.a), atIndex(pose, e.b)) - e.length),
        );
      for (const turn of step.turns) {
        if (turn.corner?.carrier) continue;
        const ends = box.creases.get(turn.crease);
        if (!ends) throw Error("Missing crease");
        for (const v of ends)
          hinge = Math.max(hinge, distance(atIndex(pose, v), atIndex(atIndex(box.poses, i), v)));
      }
      if (i === 12 || i === 15) {
        const sy = i === 12 ? 1 : -1,
          theta = (t * Math.PI) / 2;
        // Independently intersect the sphere of diagonal length sqrt(2) with the two wall planes.
        const k = Math.cos(theta) / (1 + Math.sin(theta)),
          inward = Math.sqrt(Math.max(0, 1 - k * k));
        for (const [v, [x0, y0]] of rest.entries()) {
          const along = sy * y0 - 0.5;
          if (along < 0) continue;
          const x = Math.sign(x0) * Math.min(Math.abs(x0), 2 - Math.abs(x0));
          const up = Math.max(0, Math.abs(x) - 0.5),
            diagonal = Math.min(up, along);
          const arm = along - diagonal;
          const expected: Point = [
            Math.sign(x) * (Math.min(Math.abs(x), 0.5) - diagonal * inward),
            sy * (0.5 + diagonal * k + arm * Math.cos(theta)),
            up + arm * Math.sin(theta),
          ];
          seam = Math.max(seam, distance(atIndex(pose, v), expected));
        }
      }
    }
    endpoint = Math.max(
      endpoint,
      ...poseAt(box, i, 1 - 1e-12).map((p, v) =>
        distance(p, atIndex(atIndex(box.poses, i + 1), v)),
      ),
    );
  }
  expect(Math.max(rigid, seam, hinge, endpoint)).toBeLessThan(tolerance);
  let drift = 0,
    clock = 0,
    motion = initialLessonMotion;
  const mids = box.steps.map((_, i) => poseAt(box, i, 0.5));
  for (let cycle = 0; cycle < 1000; cycle++)
    for (const dir of ["next", "previous"] as const) {
      for (let n = 0; n < box.steps.length; n++) {
        const i = dir === "next" ? n : box.steps.length - 1 - n,
          duration = atIndex(box.steps, i).durationMs;
        motion = commandLesson(box.steps, motion, dir, clock);
        clock += duration / 2;
        const mid = sampleLesson(box.steps, motion, clock);
        if (mid.step !== i || mid.progress !== 0.5) throw Error("Wrong half-fold");
        poseAt(box, i, mid.progress).forEach((p, v) => {
          drift = Math.max(drift, distance(p, atIndex(atIndex(mids, i), v)));
        });
        if (cycle === 0 && dir === "next") {
          const back = commandLesson(box.steps, motion, "previous", clock);
          const earlier = sampleLesson(box.steps, back, clock + duration / 4);
          expect(earlier.progress).toBe(0.25);
          const resume = commandLesson(box.steps, back, "next", clock + duration / 4);
          expect(sampleLesson(box.steps, resume, clock + duration / 2).progress).toBe(0.5);
        }
        clock += duration / 2;
        const end = sampleLesson(box.steps, motion, clock);
        if (poseAt(box, end.step, end.progress) !== box.poses[i + (dir === "next" ? 1 : 0)])
          throw Error("Wrong endpoint");
      }
    }
  expect(drift).toBe(0);
  console.log("Masu 18018 samples", { rigid, seam, hinge, endpoint, drift });
});

it("finds no transverse penetration between material triangles during any fold", () =>
  checkPenetrations(box));
it("rejects reversed corner coupling and missing multilayer packets", () => {
  const wrong = structuredClone(masuPattern);
  const gusset = atIndex(atIndex(wrong.steps, 12).turns, 1);
  Object.assign(gusset, { degrees: -gusset.degrees });
  expect(() => compileLesson(wrong)).toThrow(/seam/);
  const missing = structuredClone(masuPattern);
  const action = atIndex(missing.steps, 12);
  Object.assign(action, { turns: action.turns.filter((_, i) => i !== 2) });
  expect(() => compileLesson(missing)).toThrow(/seam/);
});

it("wraps the upright gussets under the lining and keeps all four tips on top of the floor", () => {
  const final = atIndex(box.poses, box.steps.length);
  const offsets = atIndex(paperLayers(box, masuHingePlies).offsets, box.steps.length);
  function uppermost(point: Point, normal: Point) {
    const hits = box.faces
      .flatMap((face, index) => {
        const [a, b, c] = points(face.vertices, final);
        if ([a, b, c].some((p) => Math.abs(dot(difference(p, point), normal)) > 1e-8)) return [];
        const signs = [
          [a, b],
          [b, c],
          [c, a],
        ].map(([u, v]) =>
          dot(cross(difference(v as Point, u as Point), difference(point, u as Point)), normal),
        );
        if (!(signs.every((k) => k >= -1e-9) || signs.every((k) => k <= 1e-9))) return [];
        const material = points(face.vertices, rest);
        return [
          {
            depth: dot(atIndex(offsets, index), normal),
            x: material.reduce((n, p) => n + p[0] / 3, 0),
            y: material.reduce((n, p) => n + p[1] / 3, 0),
          },
        ];
      })
      .sort((a, b) => b.depth - a.depth);
    if (hits.length < 2) throw Error("Expected a lined surface");
    return atIndex(hits, 0);
  }
  for (const sign of [-1, 1]) {
    for (const x of [-0.37, -0.13, 0.17, 0.39])
      for (const z of [0.12, 0.31, 0.44]) {
        const lining = uppermost([x, 0.5 * sign, z], [0, -sign, 0]);
        expect(sign * lining.y).toBeGreaterThan(1);
      }
    expect(sign * uppermost([0.08, sign * 0.39, 0], [0, 0, 1]).y).toBeGreaterThan(1.5);
    expect(sign * uppermost([sign * 0.39, 0.08, 0], [0, 0, 1]).x).toBeGreaterThan(1.5);
  }
});
