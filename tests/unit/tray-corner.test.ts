import { readFileSync } from "node:fs";
import { validatePackage } from "../../scripts/validate-package";
import { atIndex, compileLesson } from "../../app/lesson/geometry";
import { checkSheet } from "./material-checks";
import { expect, it } from "vitest";
import type { Point } from "../../app/fold/geometry";
import { chartFrame } from "../../app/lesson/chart-frame";
import { prepareBoat } from "../../app/lesson/boat-pocket";
import { prepareTray, type TrayCorner } from "../../app/lesson/tray-corner";
import { chartPoint } from "../../app/lesson/rigid-field";
import { distance } from "./material-checks";

const base = {
  kind: "tray-corner",
  center: [0.4, -0.3],
  outward: [1, 1],
  sideAngle: 38,
  endAngle: 73,
  branch: 1,
  sector: "side",
} as const;
it("closes a connected unequal-angle corner against its stationary floor on either diagonal branch", () => {
  let worst = 0;
  for (const sx of [-1, 1] as const)
    for (const sy of [-1, 1] as const)
      for (const branch of [-1, 1] as const) {
        const at = (x: number, y: number): Point => [0.4 + sx * x, -0.3 + sy * y, 0];
        const corner = at(0, 0),
          u = at(0.7, 0),
          v = at(0, 0.7),
          d = at(0.7, 0.7),
          s = at(0, -0.46),
          e = at(-0.39, 0);
        const region = (sector: TrayCorner["sector"], points: Point[]) =>
          prepareTray({ ...base, outward: [sx, sy], sector, branch }, points);
        const side = region("side", [corner, u, s]),
          end = region("end", [corner, e, v]),
          ga = region("side-gusset", [corner, u, d]),
          gb = region("end-gusset", [corner, d, v]);
        for (const t of [1e-8, ...Array.from({ length: 1001 }, (_, i) => i / 1000), 1 - 1e-8]) {
          const a = chartPoint(ga(t), u),
            b = chartPoint(gb(t), v),
            q = chartPoint(ga(t), d),
            r = chartPoint(gb(t), d);
          const alpha = (t * 38 * Math.PI) / 180,
            beta = (t * 73 * Math.PI) / 180;
          worst = Math.max(
            worst,
            distance(q, r),
            distance(chartPoint(side(t), u), a),
            distance(chartPoint(end(t), v), b),
            distance(chartPoint(side(t), s), s),
            distance(chartPoint(end(t), e), e),
            distance(a, [0.4 + 0.7 * sx * Math.cos(alpha), -0.3, 0.7 * Math.sin(alpha)]),
            distance(b, [0.4, -0.3 + 0.7 * sy * Math.cos(beta), 0.7 * Math.sin(beta)]),
            Math.abs(distance(q, a) - 0.7),
            Math.abs(distance(q, b) - 0.7),
            Math.abs(distance(q, corner) - 0.7 * Math.SQRT2),
          );
          if (t === 0.5)
            expect(Math.sign(q[2] - (a[2] + b[2]) / (1 + Math.sin(alpha) * Math.sin(beta)))).toBe(
              branch,
            );
        }
      }
  expect(worst).toBeLessThan(1e-12);
});
it("rejects an unscored diagonal, invalid end angles and degenerate chart frames", () => {
  expect(() => prepareTray({ ...base, sector: "side-gusset" }, [[0.41, 0.7, 0]])).toThrow(/sector/);
  for (const endAngle of [0, 90, NaN])
    expect(() => prepareTray({ ...base, endAngle }, [])).toThrow(/angle/);
  expect(() => chartFrame([2, 3, 4], [2, 3, 4], [1, 0, 0])).toThrow(/frame/);
  expect(() => chartFrame([0, 0, 0], [1, 2, 3], [2, 4, 6])).toThrow(/frame/);
});
it("carries a scored boat bridge and its layer normal onto a vertical back face", () => {
  const frame = chartFrame([3, -2, 5], [3, 1, 5], [3, 0, 7]);
  const bridge = prepareBoat(
    { kind: "boat-pocket", center: [0, 0], inward: 1, outward: 1, sector: "bridge", landingPly: 2 },
    [[1, 1, 0]],
  );
  const chart = frame.transport(bridge(0.5));
  expect(
    distance(chartPoint(chart, [3, -1, 6]), [4, -2 - 1 / Math.SQRT2, 5 - 1 / Math.SQRT2]),
  ).toBeLessThan(1e-12);
  expect(chart.plyNormal).toEqual([1, 0, 0]);
  expect(chart.ply).toBe(2);
});

it("validates the five-panel native example and rejects a missing moving neighbor", () => {
  const packageData = JSON.parse(readFileSync("tests/fixtures/tray-corner/lesson.json", "utf8"));
  const { pattern } = validatePackage(packageData, "tray-corner");
  const model = compileLesson(pattern);
  checkSheet(model, 4, 8);
  const s = atIndex(pattern.steps, 0),
    regions = s.regions;
  if (!regions) throw Error("Missing corner fixture regions");
  expect(() => compileLesson({ ...pattern, version: 5 })).toThrow(/version 6/);
  expect(() =>
    compileLesson({
      ...pattern,
      steps: [{ ...s, regions: regions.filter((r) => !r.faces.includes("end")) }],
    }),
  ).toThrow(/Moving field seam/);
});
