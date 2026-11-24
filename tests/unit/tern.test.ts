import { expect, it } from "vitest";
import { tern as m, ternHinges } from "../../app/lesson/tern";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { checkSheet, materialChecks, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";
import { ternPoint } from "../tern-projection";
materialChecks(m);
it("raises the throat, carries the doubled crown and spreads the wings independently", () => {
  const rest = atIndex(m.poses, 0);
  checkSheet(m, 4.5, 6 * Math.SQRT2);
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

it("keeps the alternating bill and cheek plies in order through the book and neck reverse", () => {
  const { offsets, foldOffsets } = paperLayers(m, ternHinges);
  // The sample lies inside the doubled gate, folded hem and tucked cheek, clear of their hinges.
  function billStack(stage: number) {
    const pose = atIndex(m.poses, stage);
    return m.faces
      .flatMap((face, i) => {
        const poly = face.vertices.map((v) => atIndex(pose, v));
        const sides = poly.map((a, j) => {
          const b = atIndex(poly, (j + 1) % poly.length);
          return (b[0] - a[0]) * (1.31 - a[1]) - (b[1] - a[1]) * (-0.012 - a[0]);
        });
        if (!sides.every((s) => s > 1e-9) && !sides.every((s) => s < -1e-9)) return [];
        return [
          {
            face: i,
            level: Math.round(atIndex(atIndex(offsets, stage), i)[2] / 0.0007) || 0,
            front: atIndex(sides, 0) > 0,
          },
        ];
      })
      .sort((a, b) => a.level - b.level);
  }
  for (const [stage, bottom, count] of [
    [2, 0, 4],
    [3, -4, 8],
    [4, -4, 16],
    [11, -4, 8],
  ] as const) {
    expect(billStack(stage).map((p) => [p.level, p.front])).toEqual(
      Array.from({ length: count }, (_, i) => [bottom + i, i % 2 === 0]),
    );
  }
  for (const f of [0.25, 0.5, 0.75, 1]) {
    const angle = (63 * f * Math.PI) / 180,
      lifted = foldOffsets(atIndex(offsets, 11), 11, f);
    for (const { face, level } of billStack(11)) {
      const [x, , z] = atIndex(lifted, face);
      expect((x * Math.sin(angle) + z * Math.cos(angle)) / 0.0007).toBeCloseTo(level, 10);
    }
  }
});
