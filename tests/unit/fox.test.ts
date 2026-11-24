import { fixture } from "../model-fixture";
import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import foxManuscript from "../../app/i18n/en/fox-face.json";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { verifyFlatLesson } from "./flat-lesson";

const foxFolds = fixture("fox-face").pattern.steps;
const { steps: foxText } = foxManuscript;

function foxLandmark([x, y]: Point, stage: number): Point {
  if (stage === 0) return [x, y, 0];
  const upper = y > 0;
  y = -Math.abs(y);
  if (stage === 2) x = -Math.abs(x);
  if (stage >= 4 && upper) y = Math.max(y, -1.4 - y);
  const side = Math.sign(x);
  if (stage >= (side < 0 ? 5 : 6) && Math.abs(x) > (2 * (y + 1)) / 3) {
    const along = 2 * side * x + 3 * (y + 1);
    return [(4 * side * along) / 13 - x, (6 * along) / 13 - y - 2, 0];
  }
  return [x, y, 0];
}
verifyFlatLesson("fox-face", foxFolds, foxText, foxLandmark);

it("peels only the upper loose tip and carries both sides of the muzzle into the ear packets", () => {
  const model = fixture("fox-face").model;
  const rest = atIndex(model.poses, 0);
  const top = rest.findIndex(([, y]) => y === 1),
    chin = rest.findIndex(([, y]) => y === -1);
  const mid = poseAt(model, 3, 0.5);
  expect(atIndex(mid, chin)).toEqual([0, -1, 0]);
  const raised = atIndex(mid, top);
  expect(raised[1]).toBeCloseTo(-0.7, 12);
  expect(raised[2]).toBeCloseTo(0.3, 12);
  const muzzle = new Set(atIndex(atIndex(model.steps, 3).turns, 0).faces);
  for (const step of model.steps.slice(4)) {
    const faces = atIndex(step.turns, 0).faces;
    expect(faces.some((f) => muzzle.has(f))).toBe(true);
    expect(faces.some((f) => !muzzle.has(f))).toBe(true);
  }
});
