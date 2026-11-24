import { checkContacts } from "./material-contacts";
import { expect, it } from "vitest";
import { fixture } from "../model-fixture";
import { batchPoints } from "../batch-projections";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import { checkSheet, materialChecks, distance } from "./material-checks";
import { checkPenetrations } from "./material-collisions";
for (const id of ["twin-stern-junk", "reed-runner-dinosaur"] as const) {
  const { model, presentation } = fixture(id),
    boat = id === "twin-stern-junk";
  materialChecks(model);
  it(id + " keeps a distinct drawing order on every positive-area landing and lift", () => {
    const { overlapping, approaches } = checkContacts(
      model,
      presentation.hingePlies,
      presentation.plyThickness,
    );
    expect(overlapping).toBeGreaterThan(100);
    expect(approaches).toBeGreaterThan(100);
  });
  it(
    id + " has a single square sheet and clear moving panel interiors",
    () => {
      checkSheet(model, boat ? 2 : 4, boat ? 4 * Math.SQRT2 : 8);
      checkPenetrations(model);
    },
    60000,
  );
  it(id + " agrees with independently folded stock at the opening and finishing landmarks", () => {
    let worst = 0;
    for (const position of boat
      ? [10, 18, 22, 24, 24.25, 24.5, 24.75, 25, 26, 27]
      : [1, 5, 7, 8, 11, 11.25, 11.5, 11.75, 12, 13]) {
      const points = batchPoints(id, position),
        step = Math.min(Math.floor(position), model.steps.length - 1),
        p = poseAt(model, step, position - step);
      model.vertexIds.forEach((key, j) => {
        const v = points[key];
        if (!v) throw Error(key);
        worst = Math.max(worst, distance(v.toArray(), atIndex(p, j)));
      });
    }
    expect(worst).toBeLessThan(1e-10);
    const last = atIndex(model.poses, model.steps.length);
    if (boat) {
      for (const side of [-1, 1]) {
        expect(last.some(([x, y, z]) => Math.abs(x) < 0.116 && side * y > 0.45 && z > 0.34)).toBe(
          true,
        );
        expect(
          last.some(([x, y, z]) => Math.abs(x) < 0.116 && side * y > 0.23 && Math.abs(z) < 1e-8),
        ).toBe(true);
      }
    } else {
      expect(last.some(([x, y]) => x < -0.79 && y > -0.75)).toBe(true);
      expect(last.some(([x, , z]) => x > 0.92 && Math.abs(z) > 0.18)).toBe(true);
      // The original lower corners become the toes. Their ankle reflections place them
      // 0.14 and 0.06 below the two shin hinges before the separate splay angles.
      for (const [side, x, reach, angle] of [
        [-1, -0.055, 0.14, -24],
        [1, 0.33, 0.06, 34],
      ] as const) {
        const index = atIndex(model.poses, 0).findIndex(
          ([u, v]) => Math.abs(u - side) < 1e-9 && Math.abs(v + 1) < 1e-9,
        );
        const a = (angle * Math.PI) / 180;
        expect(
          distance(atIndex(last, index), [x, -1.18 - reach * Math.cos(a), -reach * Math.sin(a)]),
        ).toBeLessThan(1e-10);
      }
    }
  });
}
