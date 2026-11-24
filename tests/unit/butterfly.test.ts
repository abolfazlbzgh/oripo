import { expect, it } from "vitest";
import { fixture } from "../model-fixture";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { materialChecks, checkSheet, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";
import { paperLayers } from "../../app/lesson/drawing";
import { wingPoint } from "../butterfly-outline";

const { model: m, presentation } = fixture("monarch-butterfly");
materialChecks(m);
it("keeps the four original corners as distinct forewing and hindwing tips on a single square", () => {
  checkSheet(m, 4, 8);
  const rest = atIndex(m.poses, 0);
  for (const s of [-1, 1])
    for (const t of [-1, 1]) {
      const v = rest.findIndex(([x, y]) => x === s && y === t);
      expect(distance(atIndex(atIndex(m.poses, 11), v), [s, 0, 0])).toBeLessThan(1e-10);
      const u = t > 0 ? 1 : 0,
        y = t > 0 ? 0 : -1;
      expect(distance(atIndex(atIndex(m.poses, 16), v), [s * u, y, 0])).toBeLessThan(1e-10);
      for (const f of [0, 0.25, 0.5, 0.75, 1])
        expect(distance(atIndex(poseAt(m, 17, f), v), wingPoint(u, y, s, 75 * f))).toBeLessThan(
          1e-10,
        );
    }
});
it("stacks the stationary back, gate, released corner and returning wall in approach order", () => {
  const ply = presentation.plyThickness ?? 0.0007;
  const layers = paperLayers(m, presentation.hingePlies, ply);
  for (const sign of [-1, 1])
    for (const [x, y, expected] of [
      [0.37, 0.11, [0, 1, 2, 3]],
      [0.57, 0.13, [2, 3]],
      [0.08, 0.33, [0, 3]],
    ] as const) {
      const pose = atIndex(m.poses, 11),
        stack = m.faces.flatMap((face, f) => {
          const signs = face.vertices.map((v, i) => {
            const [a, b] = atIndex(pose, v),
              [u, w] = atIndex(pose, atIndex(face.vertices, (i + 1) % face.vertices.length));
            return (u - a) * (y - b) - (w - b) * (sign * x - a);
          });
          return signs.every((k) => k > 1e-9) || signs.every((k) => k < -1e-9)
            ? [atIndex(atIndex(layers.offsets, 11), f)[2] / ply]
            : [];
        });
      expect(stack.sort((a, b) => a - b)).toEqual(expected.map((ply) => expect.closeTo(ply, 12)));
    }
});
it(
  "clears both boats and both wing pairs throughout the sampled folds",
  () => checkPenetrations(m),
  60000,
);
