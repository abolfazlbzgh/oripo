import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import { prepareCrimp, type Crimp } from "../../app/lesson/spatial-crimp";
import { chartPoint } from "../../app/lesson/rigid-field";

const crimp: Crimp = {
  frame: ["tail", "spine", "left"],
  side: -1,
  stations: [
    [0.4, 0.75],
    [0.7, 0.75],
  ],
  halfAngle: 60,
  hold: "spine",
  faces: ["rim"],
};
it("carries a two-station reverse through a vertical packet and returns the distal ray parallel", () => {
  // The frame is in YZ. Its unit transverse, longitudinal and normal directions are +Y,+Z,+X.
  const world = (u: number, v: number, w = 0): Point => [2 + w, 3 + u, 4 + v];
  const prepare = prepareCrimp(crimp, world(0, 0), world(0, 1), world(-1, 0));
  const middle = prepare([world(0, 0.4), world(0, 0.7), world(0.1, 0.6)]);
  const tip = prepare([world(0, 0.7), world(0, 1), world(0.1, 0.9)]);
  let maximum = 0;
  for (let i = 0; i <= 1000; i++) {
    const t = i / 1000,
      a = (t * Math.PI) / 3,
      bend = 2 * Math.atan(Math.sin(a) / 0.75);
    const elbow = world(0, 0.4 + 0.3 * Math.cos(bend), 0.3 * Math.sin(bend));
    const end: Point = [elbow[0], elbow[1], elbow[2] + 0.3];
    for (const [p, q] of [
      [chartPoint(middle(t), world(0, 0.7)), elbow],
      [chartPoint(tip(t), world(0, 1)), end],
    ] as const)
      maximum = Math.max(maximum, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
  }
  expect(maximum).toBeLessThan(1e-12);
  expect(chartPoint(tip(1), world(0, 1))[0]).toBeGreaterThan(2.29);
});
it("holds one half of an oblique packet and rejects an unscored facet", () => {
  const prepare = prepareCrimp({ ...crimp, hold: "left" }, [0, 0, 0], [0, 1, 0], [-1, 0, 0]);
  const held: Point = [-0.2, 0.15, 0];
  expect(chartPoint(prepare([held, [-0.3, 0, 0], [0, 0.1, 0]])(0.6), held)[2]).toBeCloseTo(0, 14);
  expect(() =>
    prepare([
      [0, 0, 0],
      [0.1, 0.2, 0],
      [-0.1, 0.2, 0],
    ]),
  ).toThrow(/uncut/);
  expect(() => prepare([[0, 0, 0.1]])).toThrow(/planar/);
});
