import { it, expect } from "vitest";
import { compileLesson, type FoldStep, type LessonPattern } from "../../app/lesson/geometry";
import { hexChart } from "../../app/lesson/hex-twist";
import { chartPoint } from "../../app/lesson/rigid-field";
import type { Point } from "../../app/fold/geometry";
it("closes the last moving rail against the first while preserving each 60-degree gusset", () => {
  const radius = 1,
    h = (3 + Math.sqrt(5)) / 2,
    skew = Math.atan(1 / Math.sqrt(15));
  let worst = 0;
  for (let j = 0; j < 6; j++) {
    const a = (j * Math.PI) / 3;
    const vertex = [Math.cos(a), Math.sin(a)] as const;
    const rail = (b: number): Point => [
      vertex[0] + Math.cos(b + skew),
      vertex[1] + Math.sin(b + skew),
      0,
    ];
    const left = rail(a - Math.PI / 6),
      right = rail(a + Math.PI / 6);
    const chart = hexChart(
      radius,
      (left[0] + right[0] + vertex[0]) / 3,
      (left[1] + right[1] + vertex[1]) / 3,
    );
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000,
        transform = chart(t),
        p = chartPoint(transform, left),
        q = chartPoint(transform, right);
      const gap = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
      const angle = 2 * Math.atan(Math.tan((t * Math.PI) / 2) * h ** (j % 3));
      worst = Math.max(worst, Math.abs(gap - 1), Math.abs(q[2] - Math.cos(skew) * Math.sin(angle)));
      if (i === 1000) expect(Math.abs(q[2])).toBeLessThan(1e-12);
    }
  }
  expect(worst).toBeLessThan(1e-12);
});

it("keeps a closed-twist field and a dependent reopening behind the version 4 contract", () => {
  const sheet: LessonPattern["sheet"] = {
    vertices: { a: [0, 0, 0], b: [0.1, 0, 0], c: [0, 0.1, 0] },
    faces: [{ id: "panel", vertices: ["a", "b", "c"] }],
    creases: { base: ["a", "b"] },
  };
  const fold: FoldStep = {
    id: "close",
    turns: [],
    durationMs: 10,
    guides: ["base"],
    field: { kind: "hex-twist", radius: 1 },
  };
  const reopen: FoldStep = { id: "open", turns: [], durationMs: 10, reopenTo: 0.26 };
  const run = (version: LessonPattern["version"], steps: FoldStep[]) =>
    compileLesson({ version, lessonId: "sample", sheet, steps });
  expect(() => run(3, [fold])).toThrow(/version 4/);
  expect(() => run(4, [reopen])).toThrow(/reopening/);
  expect(() => run(4, [fold, reopen, { ...reopen, id: "again" }])).toThrow(/reopening/);
  expect(run(4, [fold, reopen]).poses).toHaveLength(3);
});
