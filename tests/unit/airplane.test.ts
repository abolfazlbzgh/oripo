import { fixture } from "../model-fixture";
import { localPath } from "../../app/navigation";
import { describe, expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import airplaneManuscript from "../../app/i18n/en/paper-airplane.json";
import {
  atIndex,
  compileLesson,
  poseAt,
  tolerance,
  type LessonPattern,
} from "../../app/lesson/geometry";
import { lessons } from "../../app/lessons";

const model = fixture("paper-airplane").model;
const airplanePattern = fixture("paper-airplane").pattern;
const { steps: airplaneText } = airplaneManuscript;

const airplaneInfo = atIndex(lessons, 0);
const rest = atIndex(model.poses, 0);
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const rad = Math.PI / 180;

// Independent planar reflections, followed by the closed body's upright section.
// This oracle uses the material angle and radius, never the compiled turns or layer masks.
function landmark([x, y]: Point, stage: number): Point {
  const sign = x < 0 ? -1 : 1;
  if (stage <= 2) return [stage === 1 ? -Math.abs(x) : x, y, 0];
  const r = Math.hypot(x, 1.5 - y);
  let angle = Math.atan2(Math.abs(x), 1.5 - y);
  if (stage >= (sign < 0 ? 3 : 4)) angle = Math.min(angle, Math.PI / 2 - angle);
  if (stage >= (sign < 0 ? 5 : 6)) angle = Math.min(angle, Math.PI / 4 - angle);
  const u = r * Math.sin(angle),
    v = r * Math.cos(angle);
  if (stage < 7) return [sign * u, 1.5 - v, 0];
  const b = Math.atan(0.1);
  if (stage < (sign < 0 ? 8 : 9) || angle <= b) return [0, 1.5 - v, u];
  const along = r * Math.cos(angle - b),
    across = r * Math.sin(angle - b);
  return [
    sign * across * Math.sin(84 * rad),
    1.5 - along * Math.cos(b) + across * Math.sin(b) * Math.cos(84 * rad),
    along * Math.sin(b) + across * Math.cos(b) * Math.cos(84 * rad),
  ];
}

it("publishes one versioned dart, with English instructions and an endpoint for every stable action", () => {
  expect(airplaneInfo.availability).toBe("playable");
  expect(airplaneInfo.id).toBe(model.lessonId);
  expect(lessons.map((l) => localPath("en", l.id))).toContain("/en/lessons/paper-airplane");
  expect(Object.keys(airplaneText).sort()).toEqual(model.steps.map((s) => s.id).sort());
  expect(Object.values(airplaneText).every((s) => s.instruction && s.result && s.title)).toBe(true);
  expect(model.poses.length).toBe(model.steps.length + 1);
  expect(model.steps.map((s) => s.turns.map((t) => t.faces.length))).toEqual([
    [8],
    [8],
    [4],
    [4],
    [4],
    [4],
    [8, 8],
    [4],
    [4],
  ]);
});

describe("pattern validation", () => {
  const invalid: [string, (p: LessonPattern) => void, RegExp][] = [
    ["version", (p) => Object.assign(p, { version: 999 }), /version/],
    [
      "reversed winding",
      (p) => {
        const face = atIndex(p.sheet.faces, 0);
        Object.assign(face, { vertices: [...face.vertices].reverse() });
      },
      /counterclockwise/,
    ],
    [
      "disconnected faces",
      (p) => {
        Object.assign(p.sheet.vertices, { a: [4, 0, 0], b: [5, 0, 0], c: [4, 1, 0] });
        Object.assign(p.sheet, {
          faces: [...p.sheet.faces, { id: "island", vertices: ["a", "b", "c"] }],
        });
      },
      /connected sheet/,
    ],
    [
      "step ID",
      (p) => Object.assign(atIndex(p.steps, 2), { id: atIndex(p.steps, 0).id }),
      /Duplicate step/,
    ],
    [
      "face ID",
      (p) => Object.assign(atIndex(p.sheet.faces, 0), { id: atIndex(p.sheet.faces, 1).id }),
      /Duplicate face/,
    ],
    ["duration", (p) => Object.assign(atIndex(p.steps, 0), { durationMs: NaN }), /Invalid step/],
    ["zero duration", (p) => Object.assign(atIndex(p.steps, 0), { durationMs: 0 }), /Invalid step/],
    ["absent action", (p) => Object.assign(atIndex(p.steps, 1), { turns: [] }), /Invalid step/],
    [
      "axis endpoint",
      (p) => Object.assign(p.sheet.creases, { spine: ["nose", "missing"] }),
      /Unknown vertex/,
    ],
    [
      "coincident endpoints",
      (p) => Object.assign(p.sheet.creases, { spine: ["nose", "nose"] }),
      /Collapsed crease/,
    ],
    [
      "unknown face",
      (p) => Object.assign(atIndex(atIndex(p.steps, 0).turns, 0), { faces: ["ghost"] }),
      /Unknown face/,
    ],
    [
      "unknown crease",
      (p) => Object.assign(atIndex(atIndex(p.steps, 0).turns, 0), { crease: "ghost" }),
      /Unknown crease/,
    ],
    [
      "double assignment",
      (p) => Object.assign(atIndex(atIndex(p.steps, 0).turns, 0), { faces: ["left-3", "left-3"] }),
      /assigned twice/,
    ],
    [
      "nonfinite angle",
      (p) => Object.assign(atIndex(atIndex(p.steps, 0).turns, 0), { degrees: Infinity }),
      /Invalid angle/,
    ],
    [
      "missing ply",
      (p) =>
        Object.assign(atIndex(atIndex(p.steps, 7).turns, 0), {
          faces: ["left-1", "left-2", "left-5"],
        }),
      /Off-axis seam/,
    ],
  ];
  it.each(invalid)("rejects %s", (_name, change, error) => {
    const broken: LessonPattern = structuredClone(airplanePattern);
    change(broken);
    expect(() => compileLesson(broken)).toThrow(error);
  });
});

it("tiles one 2 by 3 disk, with a single oriented material boundary of length ten", () => {
  const edges = new Map<string, number[]>();
  let area = 0;
  for (const { vertices } of model.faces) {
    let twiceArea = 0;
    vertices.forEach((v, i) => {
      const w = atIndex(vertices, (i + 1) % vertices.length);
      const [x, y] = atIndex(rest, v),
        [u, t] = atIndex(rest, w);
      twiceArea += x * t - y * u;
      const key = [Math.min(v, w), Math.max(v, w)].join("/");
      edges.set(key, [...(edges.get(key) ?? []), v < w ? 1 : -1]);
    });
    expect(twiceArea).toBeGreaterThan(0);
    area += twiceArea / 2;
  }
  let perimeter = 0;
  const rim = new Map<number, number>();
  for (const [key, uses] of edges) {
    if (uses.length === 2) {
      expect(uses[0]).toBe(-atIndex(uses, 1));
      continue;
    }
    expect(uses).toHaveLength(1);
    const [v, w] = key.split("/").map(Number) as [number, number];
    const [a, b]: [number, number] = uses[0] === 1 ? [v, w] : [w, v];
    expect(rim.has(a)).toBe(false);
    rim.set(a, b);
    perimeter += distance(atIndex(rest, v), atIndex(rest, w));
  }
  const first = rim.keys().next().value;
  if (first === undefined) throw new Error("Empty sheet boundary");
  let v = first;
  do {
    const w = rim.get(v);
    if (w === undefined) throw new Error("Broken sheet boundary");
    rim.delete(v);
    v = w;
  } while (v !== first);
  expect(rim.size).toBe(0);
  expect([rest.length, model.faces.length, edges.size]).toEqual([20, 16, 35]);
  expect(area).toBeCloseTo(6, 12);
  expect(perimeter).toBeCloseTo(10, 12);
});

it("matches all ten independent landmark poses, including a keel and two swept, raised wings", () => {
  let error = 0;
  model.poses.forEach((pose, stage) =>
    pose.forEach((p, i) => {
      error = Math.max(error, distance(p, landmark(atIndex(rest, i), stage)));
    }),
  );
  expect(error).toBeLessThan(tolerance);
  expect(model.poses[2]).toEqual(rest);
  const final = atIndex(model.poses, model.steps.length);
  const point = (id: string) => atIndex(final, model.vertexIds.indexOf(id));
  expect(point("nose")).toEqual([0, 1.5, 0]);
  expect(point("tail")).toEqual([0, -1.5, 0]);
  expect(point("right-ray-1")[2]).toBeCloseTo(0.3, 12);
  expect(point("left-ray-2")[0]).toBeLessThan(-0.74);
  expect(point("right-ray-2")[0]).toBeGreaterThan(0.74);
  expect(point("right-rear")[2]).toBeGreaterThan(0.35);
  console.info("Dart endpoint evidence", {
    landmarkError: error,
    wingspan: point("right-ray-2")[0] - point("left-ray-2")[0],
    tailKeelHeight: point("right-ray-1")[2],
  });
});

it("preserves rigid face distances, packet hinges and seam positions through 1,001 poses per action", () => {
  let edgeError = 0,
    hingeError = 0,
    seamError = 0;
  for (const [i, step] of model.steps.entries()) {
    const start = atIndex(model.poses, i);
    expect(poseAt(model, i, 0)).toBe(start);
    expect(poseAt(model, i, 1)).toBe(model.poses[i + 1]);
    if (i + 1 < model.steps.length) expect(poseAt(model, i, 1)).toBe(poseAt(model, i + 1, 0));
    for (let sample = 0; sample <= 1000; sample++) {
      const p = sample / 1000,
        pose = poseAt(model, i, p);
      for (const [f, face] of model.faces.entries()) {
        const turn = step.turns.find((t) => t.faces.includes(f));
        for (const [j, v] of face.vertices.entries()) {
          const point = atIndex(pose, v);
          for (const w of face.vertices.slice(0, j))
            edgeError = Math.max(
              edgeError,
              Math.abs(
                distance(point, atIndex(pose, w)) - distance(atIndex(rest, v), atIndex(rest, w)),
              ),
            );
          if (!turn) {
            seamError = Math.max(seamError, distance(point, atIndex(start, v)));
            continue;
          }
          // Independent axis projection plus sine/cosine basis, including pinned shared joints.
          const [a, b, c] = turn.axis,
            [x, y, z] = atIndex(start, v).map((n, k) => n - atIndex(turn.origin, k)) as [
              number,
              number,
              number,
            ];
          const dot = a * x + b * y + c * z,
            cos = Math.cos(turn.degrees * rad * p),
            sin = Math.sin(turn.degrees * rad * p);
          const expected: Point = [
            turn.origin[0] + x * cos + (b * z - c * y) * sin + a * dot * (1 - cos),
            turn.origin[1] + y * cos + (c * x - a * z) * sin + b * dot * (1 - cos),
            turn.origin[2] + z * cos + (a * y - b * x) * sin + c * dot * (1 - cos),
          ];
          seamError = Math.max(seamError, distance(point, expected));
        }
      }
      for (const turn of step.turns) {
        const ends = model.creases.get(turn.crease);
        if (!ends) throw new Error(`Missing test hinge ${turn.crease}`);
        for (const v of ends)
          hingeError = Math.max(hingeError, distance(atIndex(start, v), atIndex(pose, v)));
      }
      // Through closure the moving paper stays above the support. Outboard wing
      // packets then occupy opposite half-spaces, separated by the upright body.
      for (const [v, [x, , z]] of pose.entries()) {
        if (z < -tolerance) throw Error(`Sheet passed through the support in ${step.id}`);
        if (i >= 6 && x * (atIndex(rest, v)[0] < 0 ? -1 : 1) < -tolerance)
          throw Error(`Crossed body in ${step.id}`);
      }
    }
  }
  for (const e of [edgeError, hingeError, seamError]) expect(e).toBeLessThan(tolerance);
  console.info("Dart 9,009 poses", { edgeError, hingeError, seamError });
});
