import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import {
  atIndex,
  compileLesson,
  poseAt,
  type LessonPattern,
  type FoldStep,
} from "../../app/lesson/geometry";
import { distance } from "./material-checks";
import { fixture } from "../model-fixture";
import { paperLayers } from "../../app/lesson/drawing";
import type { BoatPocket } from "../../app/lesson/boat-pocket";

it("opens the complete double gate on a carried plane and transports its drawing ranks", () => {
  const { pattern, model, presentation } = fixture("monarch-butterfly");
  const k = pattern.steps.findIndex((s) => s.id === "pull-north-pockets"),
    original = atIndex(pattern.steps, k),
    pose = atIndex(model.poses, k);
  const pin = (x: number, y: number) =>
    atIndex(
      model.vertexIds,
      pose.findIndex((p) => distance(p, [x, y, 0]) < 1e-8),
    );
  const o = pin(0, 0),
    x = pin(0.5, 0),
    y = pin(0, 0.5),
    frame = [o, x, y] as const;
  const turn: FoldStep = {
    id: "tilt",
    durationMs: 1000,
    turns: [{ crease: "tilt", degrees: 90, faces: pattern.sheet.faces.map((f) => f.id) }],
  };
  const regions = original.regions?.map((r) => ({
    ...r,
    field: { ...r.field, frame } as BoatPocket,
  }));
  const spec: LessonPattern = {
    ...pattern,
    version: 6,
    sheet: { ...pattern.sheet, creases: { ...pattern.sheet.creases, tilt: [o, x] } },
    steps: [...pattern.steps.slice(0, k), turn, { ...original, regions }],
  };
  const transported = compileLesson(spec),
    sourceLayers = paperLayers(model, presentation.hingePlies, presentation.plyThickness);
  const destLayers = paperLayers(
    transported,
    { ...presentation.hingePlies, tilt: 0 },
    presentation.plyThickness,
  );
  const rotate = ([x, y, z]: Point): Point => [x, -z, y];
  let worst = 0;
  for (let n = 0; n <= 1000; n++) {
    const t = n / 1000,
      source = poseAt(model, k, t),
      dest = poseAt(transported, k + 1, t);
    const layers = sourceLayers.foldOffsets(atIndex(sourceLayers.offsets, k), k, t);
    const carried = destLayers.foldOffsets(atIndex(destLayers.offsets, k + 1), k + 1, t);
    for (const [i, p] of source.entries())
      worst = Math.max(worst, distance(rotate(p), atIndex(dest, i)));
    for (const [i, p] of layers.entries())
      worst = Math.max(worst, distance(rotate(p), atIndex(carried, i)));
  }
  expect(worst).toBeLessThan(1e-12);
  expect(() => compileLesson({ ...spec, steps: [...spec.steps.slice(0, -1), original] })).toThrow(
    /flat starting packet/,
  );
  expect(() => compileLesson({ ...spec, version: 5 })).toThrow(/flat starting packet|version 6/);
});

const strip: LessonPattern["sheet"] = {
  vertices: {
    a: [-1, 0, 0],
    b: [0, 0, 0],
    c: [1, 0, 0],
    d: [1, 1, 0],
    e: [0, 1, 0],
    f: [-1, 1, 0],
  },
  faces: [
    { id: "desk", vertices: ["a", "b", "e", "f"] },
    { id: "page", vertices: ["b", "c", "d", "e"] },
  ],
  creases: { spine: ["b", "e"] },
};
it("keeps a fixed neighbor beside a spatial wall and rejects a tilted packet measured in its neighbor's plane", () => {
  const field: BoatPocket = {
    kind: "boat-pocket",
    center: [0, 0],
    frame: ["b", "e", "c"],
    inward: 1,
    outward: 1,
    sector: "wall",
    landingPly: 0,
  };
  const lift: FoldStep = {
    id: "lift",
    durationMs: 900,
    turns: [{ crease: "spine", degrees: 50, faces: ["page"] }],
  };
  const action = (f: BoatPocket): FoldStep => ({
    id: "swing",
    durationMs: 900,
    guides: ["spine"],
    turns: [],
    regions: [{ faces: ["page"], field: f }],
  });
  const spec: LessonPattern = {
    lessonId: "hinged-page",
    version: 6,
    sheet: strip,
    steps: [lift, action(field)],
  };
  const model = compileLesson(spec);
  for (const t of [0, 1e-6, 0.25, 0.5, 0.75, 1 - 1e-6, 1]) {
    const p = poseAt(model, 1, t),
      r = ((50 + 180 * t) * Math.PI) / 180;
    expect(
      distance(atIndex(p, model.vertexIds.indexOf("c")), [Math.cos(r), 0, -Math.sin(r)]),
    ).toBeLessThan(1e-12);
    expect(atIndex(p, model.vertexIds.indexOf("a"))).toEqual([-1, 0, 0]);
  }
  expect(() =>
    compileLesson({ ...spec, steps: [lift, action({ ...field, frame: ["b", "e", "a"] })] }),
  ).toThrow(/local chart plane/);
  expect(() =>
    compileLesson({ ...spec, steps: [lift, action({ ...field, center: [0, -0.2] })] }),
  ).toThrow(/Moving field seam/);
});
it("rejects a serial reverse on a split book when the distal spine leaves its mate", () => {
  const sheet: LessonPattern["sheet"] = {
    vertices: {
      a: [-1, 0, 0],
      o: [0, 0, 0],
      b: [1, 0, 0],
      c: [1, 2, 0],
      tip: [0, 2, 0],
      d: [-1, 2, 0],
      k: [0, 1, 0],
    },
    faces: [
      { id: "left", vertices: ["a", "o", "k", "d"] },
      { id: "right", vertices: ["o", "b", "c", "k"] },
      { id: "left-tip", vertices: ["d", "k", "tip"] },
      { id: "right-tip", vertices: ["k", "c", "tip"] },
    ],
    creases: { spine: ["o", "tip"], reverse: ["k", "d"] },
  };
  expect(() =>
    compileLesson({
      lessonId: "book-reverse",
      version: 4,
      sheet,
      steps: [
        {
          id: "open",
          durationMs: 1000,
          turns: [
            { crease: "spine", degrees: 60, faces: ["left", "left-tip"] },
            { crease: "spine", degrees: -60, faces: ["right", "right-tip"] },
          ],
        },
        {
          id: "reverse",
          durationMs: 1000,
          turns: [{ crease: "reverse", degrees: 45, faces: ["left-tip"] }],
        },
      ],
    }),
  ).toThrow(/Off-axis seam.*tip/);
});
