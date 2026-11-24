import { describe, expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import { atIndex, compileLesson, poseAt, type LessonPattern } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { guideEdges, guidePoint } from "../../app/lesson/guides";
import { orbitEye, resolveViews, validateViews } from "../../app/lesson/camera";
import { commandLesson, sampleLesson, seekLesson, settleLesson } from "../../app/lesson/playback";
import { fixture } from "../model-fixture";
import { validatePackage } from "../../scripts/validate-package";

const steps = [
  { id: "mark", durationMs: 1000 },
  { id: "undo", durationMs: 2000 },
  { id: "lift", durationMs: 800 },
];
const top: Point = [1, -1, 3],
  back: Point = [1, -1, -3];
const view = {
  position: [...top] as [number, number, number],
  minDistance: 1,
  maxDistance: 6,
  inspectBack: true,
};
const camera = {
  steps: [{ step: "undo", position: back, transitionMs: 600 }],
  finished: { position: top, transitionMs: 400 },
};
const views = resolveViews(steps, view, camera);
it("resolves sparse inheritance in framed studio coordinates and accepts old packages", () => {
  expect(views.map((c) => c.position)).toEqual([top, back, back, top]);
  expect(resolveViews(steps, view).map((c) => c.position)).toEqual([top, top, top, top]);
  expect(
    resolveViews(steps, { ...view, materialFrame: { center: [5, -4, 2], scale: 3 } }, camera),
  ).toEqual(views);
  for (const p of [0, 1, 1.12, 2.9, 3, 1.12])
    expect(sampleLesson(steps, seekLesson(steps, p), 1e6, views).eye).toEqual(
      views[Math.floor(p)]?.position,
    );
});
describe("strict camera authoring", () => {
  const cue = atIndex(camera.steps, 0);
  it.each([
    { ...cue, step: "missing" },
    { ...cue, transitionMs: 150 },
    { ...cue, transitionMs: 500.5 },
    { ...cue, position: [0, 0, 0] },
    { ...cue, position: [0, 0, 3] },
    { ...cue, position: [10, 2, 0] },
    { ...cue, position: [NaN, 0, 2] },
    { ...cue, position: [0, Infinity, 2] },
  ])("rejects an invalid cue %#", (c) => {
    expect(() => validateViews(steps, view, { steps: [c as typeof cue] })).toThrow();
  });
  it("rejects ambiguous step assignments, restricted backs and undeclared fields", () => {
    expect(() => validateViews(steps, view, { steps: [cue, cue] })).toThrow(/Duplicate/);
    expect(() => validateViews(steps, { ...view, inspectBack: false }, camera)).toThrow();
    const { model, ...p } = fixture("fox-face");
    expect(model.steps.length).toBeGreaterThan(0);
    expect(() =>
      validatePackage(
        { ...p, presentation: { ...p.presentation, camera: { script: "spin" } } },
        "fox-face",
      ),
    ).toThrow();
  });
});
it("takes the short angular path, including across the azimuth seam and opposite elevations", () => {
  const a: Point = [-3, 0.01, 1],
    b: Point = [-3, -0.01, -1];
  expect(orbitEye(a, b, 0)).toBe(a);
  expect(orbitEye(a, b, 1)).toBe(b);
  expect(orbitEye(a, b, 0.5)[0]).toBeLessThan(-3);
  for (const target of [back, [-1, 1, -3] as Point, b])
    for (let i = 0; i <= 100; i++) {
      const p = orbitEye(top, target, i / 100);
      expect(p.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...p)).toBeGreaterThan(3);
    }
});
it("carries elapsed time across a crease reveal, three folds and a still-paper finish", () => {
  const run = commandLesson(steps, seekLesson(steps, 0), "play", 0);
  for (const [t, p, phase] of [
    [0, 0, "fold"],
    [1000, 1, "turn"],
    [1599, 1, "turn"],
    [1600, 1, "reveal"],
    [1700, 1, "fold"],
    [2700, 1.5, "fold"],
    [3700, 2, "fold"],
    [4500, 3, "finish"],
    [4900, 3, "rest"],
  ] as const)
    expect(sampleLesson(steps, run, t, views)).toMatchObject({ position: p, phase });
  const fin = sampleLesson(steps, run, 4650, views),
    pause = commandLesson(steps, run, "pause", 4700, false, fin.position, fin);
  expect(sampleLesson(steps, pause, 99999, views)).toMatchObject({
    position: 3,
    eye: fin.eye,
    unfinishedShowcase: true,
  });
  const resumed = commandLesson(steps, pause, "play", 5000, false, 3, fin);
  expect(sampleLesson(steps, resumed, 5250, views)).toMatchObject({
    phase: "rest",
    position: 3,
    eye: top,
  });
});
it("pauses a turn at its rendered frame and reanchors reverse to the fold being undone", () => {
  const run = commandLesson(steps, seekLesson(steps, 0), "play", 0);
  const during = sampleLesson(steps, run, 1300, views),
    pause = commandLesson(steps, run, "pause", 1350, false, 1, during);
  const held = sampleLesson(steps, pause, 1e5, views);
  expect(held).toMatchObject({ position: 1, eye: during.eye, travel: "rest" });
  const reverse = commandLesson(steps, pause, "previous", 2000, false, 1, held);
  expect(sampleLesson(steps, reverse, 2000, views)).toMatchObject({
    step: 0,
    progress: 1,
    eye: held.eye,
    travel: "reverse",
  });
  expect(sampleLesson(steps, reverse, 5000, views)).toMatchObject({ position: 0, eye: top });
  expect(sampleLesson(steps, settleLesson(run, 1), 5000, views)).toMatchObject({
    position: 1,
    eye: back,
    travel: "rest",
  });
});
it("keeps manual inspection through the current action and a held gesture through subsequent actions", () => {
  const manual: Point = [2, -2, 1];
  const run = {
    ...commandLesson(steps, seekLesson(steps, 0.5), "play", 0),
    manualStep: 0,
    eye: manual,
  };
  expect(sampleLesson(steps, run, 300, views)).toMatchObject({ position: 0.8, eye: manual });
  expect(sampleLesson(steps, run, 550, views)).toMatchObject({ position: 1, phase: "turn" });
  expect(sampleLesson(steps, { ...run, manualStep: "gesture" }, 1500, views)).toMatchObject({
    position: 1.5,
    eye: manual,
  });
});
it("attaches the hinge to the moving ply underneath an opaque covering triangle", () => {
  const pattern: LessonPattern = {
    lessonId: "layers",
    version: 1,
    sheet: {
      vertices: { a: [0, 0, 0], b: [1, 0, 0], c: [1, 1, 0], d: [0, 1, 0] },
      faces: [
        { id: "base", vertices: ["a", "b", "c"] },
        { id: "flap", vertices: ["a", "c", "d"] },
      ],
      creases: { diagonal: ["a", "c"] },
    },
    steps: [
      {
        id: "close",
        durationMs: 1000,
        turns: [{ crease: "diagonal", faces: ["flap"], degrees: 180 }],
      },
      {
        id: "uncover",
        durationMs: 1000,
        turns: [{ crease: "diagonal", faces: ["flap"], degrees: -180 }],
      },
    ],
  };
  const model = compileLesson(pattern),
    offsets = atIndex(paperLayers(model, { close: -1, uncover: -1 }, 0.001).offsets, 1);
  const edge = atIndex(atIndex(guideEdges(model), 1), 0),
    pose = poseAt(model, 1, 0);
  expect(edge.face).toBe(1);
  const line = guidePoint(pose, offsets, edge.a, edge.face);
  expect(line[2]).toBeCloseTo(-0.002, 9);
  expect(atIndex(offsets, 0)[2]).toBe(0);
});
it("finds segmented moving-packet guides for every dinosaur action including the carried shin", () => {
  const m = fixture("reed-runner-dinosaur").model,
    edges = guideEdges(m);
  for (const [i, s] of m.steps.entries())
    expect(new Set(atIndex(edges, i).map((e) => e.crease))).toEqual(new Set(s.guides));
  const shin = atIndex(edges, 11).filter((e) => e.crease === "trailing-shin");
  expect(shin.length).toBeGreaterThan(0);
  expect(shin.every((e) => atIndex(atIndex(m.steps, 11).turns, 1).faces.includes(e.face))).toBe(
    true,
  );
});
