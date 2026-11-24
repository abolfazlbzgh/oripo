import { expect, it } from "vitest";
import { tern as m, ternHinges } from "../../app/lesson/tern";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { materialChecks, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";
import { ternPoint } from "../tern-projection";
materialChecks(m);
it("raises the throat, carries the doubled crown and spreads the wings independently", () => {
  const rest = atIndex(m.poses, 0);
  expect(rest.length - m.edges.length + m.faces.length).toBe(1);
  expect(
    m.edges
      .filter((e) => e.faces.length === 1)
      .reduce((s, e) => s + distance(atIndex(rest, e.a), atIndex(rest, e.b)), 0),
  ).toBeCloseTo(6 * Math.SQRT2, 12);
  let worst = 0;
  for (const step of [11, 12, 13, 14])
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const pose = poseAt(m, step, t);
      rest.forEach(([x, y], i) => {
        const angle = 63 * (step === 11 ? t : 1),
          wing = step === 12 && x < 0 ? t : step === 13 ? (x < 0 ? 1 : t) : step === 14 ? 1 : 0;
        worst = Math.max(
          worst,
          distance(atIndex(pose, i), ternPoint([x, y], angle, wing, step === 14 ? t : 0)),
        );
      });
    }
  expect(worst).toBeLessThan(1e-12);
  const bend = 2 * Math.atan(Math.sin((63 * Math.PI) / 180) / 1.3);
  expect(ternPoint([0, 1.35], 63, 1)[2]).toBeCloseTo(0.36 * Math.sin(bend), 12);
  const layers = atIndex(paperLayers(m, ternHinges).offsets, 2);
  expect(new Set(layers.map((p) => Math.round(p[2] / 0.0007)))).toEqual(new Set([0, 1, 2, 3]));
  console.info(
    "tern landmark residual",
    worst,
    "throat rise",
    0.36 * Math.sin(bend),
    "wingtip",
    ternPoint([3 * (1 - 1 / Math.SQRT2), 1.5 - 3 / Math.SQRT2], 63, 1, 1),
  );
});
it(
  "keeps the stacked reference folds, neck and free wings clear",
  () => checkPenetrations(m),
  60000,
);
