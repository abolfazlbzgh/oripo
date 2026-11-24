import { expect, it } from "vitest";
import {
  atIndex,
  compileLesson,
  packetTransform,
  poseAt,
  type LessonPattern,
  type PreparedTurn,
} from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";

// Three adjacent unit panels with two parallel, upward-directed creases.
const strip: LessonPattern = {
  version: 1,
  lessonId: "fold-strip",
  sheet: {
    vertices: {
      a: [0, 0, 0],
      b: [1, 0, 0],
      c: [2, 0, 0],
      d: [3, 0, 0],
      e: [0, 1, 0],
      f: [1, 1, 0],
      g: [2, 1, 0],
      h: [3, 1, 0],
    },
    faces: [
      { id: "left", vertices: ["a", "b", "f", "e"] },
      { id: "middle", vertices: ["b", "c", "g", "f"] },
      { id: "right", vertices: ["c", "d", "h", "g"] },
    ],
    creases: { first: ["b", "f"], second: ["c", "g"] },
  },
  steps: [
    {
      id: "lift",
      durationMs: 900,
      turns: [{ crease: "first", degrees: -90, faces: ["middle", "right"] }],
    },
    {
      id: "return-tip",
      durationMs: 700,
      turns: [{ crease: "second", degrees: 90, faces: ["right"] }],
    },
  ],
};
it("carries the second hinge into the first endpoint and rotates its drawing stack separately", () => {
  const model = compileLesson(strip);
  const tip = model.vertexIds.indexOf("d");
  expect(poseAt(model, 0, 1)[tip]).toEqual([1, 0, 2]);
  const mid = poseAt(model, 1, 0.5)[tip];
  expect(mid?.[0]).toBeCloseTo(1 + Math.SQRT1_2, 12);
  expect(mid?.[2]).toBeCloseTo(1 + Math.SQRT1_2, 12);
  expect(poseAt(model, 1, 1)[tip]).toEqual([2, 0, 1]);
  const layers = paperLayers(model, { lift: 1, "return-tip": 2 }, 0.125);
  expect(layers.offsets[2]).toEqual([
    [0, 0, 0],
    [0.125, 0, 0.125],
    [-0.125, 0, 0.125],
  ]);
});

it("composes the nonlinear gusset with its carrier in the same order for both pivot spaces", () => {
  const carrier: PreparedTurn = {
    crease: "wall",
    origin: [1, 0, 0],
    axis: [0, 1, 0],
    degrees: 90,
    faces: [],
    vertices: [],
  };
  const corner: PreparedTurn = {
    crease: "corner",
    origin: [2, 0, 0],
    axis: [1, 0, 0],
    degrees: 90,
    corner: { carrier },
    faces: [],
    vertices: [],
  };
  for (const p of [0, 0.375, 1]) {
    const wall = (p * Math.PI) / 2,
      s = Math.sin(wall),
      c = Math.cos(wall);
    const localCos = c / (1 + s),
      localSin = Math.sqrt(1 - localCos ** 2);
    const material = packetTransform(corner, p)([2, 1, 0]);
    const offset = packetTransform(corner, p, (hinge) => [0, 0, hinge === carrier ? 2 : 1])([
      0, 1, 1,
    ]);
    const expectedMaterial = [1 + c + s * localSin, localCos, -s + c * localSin];
    const expectedOffset = [s * (localSin - 1), localCos, 2 + c * (localSin - 1)];
    material.forEach((value, i) => expect(value).toBeCloseTo(atIndex(expectedMaterial, i), 12));
    offset.forEach((value, i) => expect(value).toBeCloseTo(atIndex(expectedOffset, i), 12));
  }
});

it("identifies an ambiguous carrier before assigning a seam to one of its turns", () => {
  expect(() =>
    compileLesson({
      ...strip,
      version: 2,
      steps: [
        {
          id: "raise",
          durationMs: 900,
          turns: [
            { crease: "first", degrees: 90, faces: ["left"] },
            { crease: "first", degrees: -90, faces: ["middle"] },
            {
              crease: "second",
              degrees: 90,
              faces: ["right"],
              corner: { motion: "right-gusset", carriedBy: "first" },
            },
          ],
        },
      ],
    }),
  ).toThrow(/fold-strip\/raise: Invalid gusset carrier first for second/);
});
