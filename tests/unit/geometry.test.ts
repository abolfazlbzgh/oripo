import { describe, expect, it } from "vitest";
import {
  clampProgress,
  crease,
  fixedPanel,
  hingeRotationY,
  movingPanel,
  movingPanelAt,
  type Point,
} from "../../app/fold/geometry";

const epsilon = 1e-6;
function distance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe("the square and its rigid hinge", () => {
  it("tiles a two-unit square with two unit-wide rectangles and one shared crease", () => {
    expect(fixedPanel).toEqual([
      [-1, -1, 0],
      [0, -1, 0],
      [0, 1, 0],
      [-1, 1, 0],
    ]);
    expect(movingPanel).toEqual([
      [0, -1, 0],
      [1, -1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ]);
    expect([fixedPanel[1], fixedPanel[2]]).toEqual(crease);
    expect([movingPanel[0], movingPanel[3]]).toEqual(crease);
  });

  it.each([0, 45, 90, 135, 180])("keeps the hinge fixed at %i degrees", (degrees) => {
    const panel = movingPanelAt(degrees / 180);
    expect([panel[0], panel[3]]).toEqual(crease);
    expect(hingeRotationY(degrees / 180)).toBe((-degrees * Math.PI) / 180);
  });

  it("preserves all four edges and both diagonals at 1,001 samples", () => {
    for (let sample = 0; sample <= 1000; sample++) {
      const panel = movingPanelAt(sample / 1000);
      for (const i of [0, 1, 2, 3] as const) {
        const a = panel[i];
        expect(a.every(Number.isFinite)).toBe(true);
        for (const j of [0, 1, 2, 3] as const) {
          if (i >= j) continue;
          const error = Math.abs(distance(a, panel[j]) - distance(movingPanel[i], movingPanel[j]));
          expect(error).toBeLessThanOrEqual(epsilon);
        }
      }
    }
  });

  it("lifts both outer corners upright and closes exactly onto the fixed half", () => {
    expect(movingPanelAt(0)).toEqual(movingPanel);
    const upright = movingPanelAt(0.5);
    expect(distance(upright[1], [0, -1, 1])).toBeLessThanOrEqual(epsilon);
    expect(distance(upright[2], [0, 1, 1])).toBeLessThanOrEqual(epsilon);
    expect(movingPanelAt(1)).toEqual([fixedPanel[1], fixedPanel[0], fixedPanel[3], fixedPanel[2]]);
  });

  it("retraces intermediate and endpoint poses exactly across 1,000 round trips", () => {
    const forward = [0, 0.125, 0.5, 0.875, 1].map(movingPanelAt);
    for (let cycle = 0; cycle < 1000; cycle++) {
      expect([0, 0.125, 0.5, 0.875, 1].map(movingPanelAt)).toEqual(forward);
      expect([1, 0.875, 0.5, 0.125, 0].map(movingPanelAt)).toEqual([...forward].reverse());
    }
    expect(movingPanelAt(0)).toEqual(movingPanel);
  });

  it.each([
    [NaN, 0],
    [-Infinity, 0],
    [-0.1, 0],
    [0.42, 0.42],
    [1.1, 1],
    [Infinity, 1],
  ])("normalizes %s to %s without invalid coordinates", (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
    expect(movingPanelAt(input)).toEqual(movingPanelAt(expected));
  });
});
