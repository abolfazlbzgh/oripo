import { expect, it } from "vitest";
import { prepareBoat, type BoatPocket } from "../../app/lesson/boat-pocket";
import { chartPoint } from "../../app/lesson/rigid-field";
import { distance } from "./material-checks";

it("joins the gate diagonal and wall on the exposed branch for either hand and either end", () => {
  let seam = 0,
    rigid = 0,
    clearance = Infinity;
  for (const inward of [-1, 1] as const)
    for (const outward of [-1, 1] as const) {
      const make = (sector: BoatPocket["sector"]) =>
        prepareBoat(
          { kind: "boat-pocket", center: [0, 0], inward, outward, sector, landingPly: 1 },
          [[0, 0, 0]],
        );
      const wall = make("wall"),
        wing = make("wing"),
        bridge = make("bridge");
      for (let n = 0; n <= 1000; n++) {
        const t = n / 1000,
          q = chartPoint(bridge(t), [inward, outward, 0]),
          a = t * Math.PI;
        for (const chart of [wall(t), wing(t), bridge(t)])
          rigid = Math.max(
            rigid,
            Math.abs(Math.hypot(...chart.x) - 1),
            Math.abs(Math.hypot(...chart.y) - 1),
            Math.abs(chart.x.reduce((sum, v, i) => sum + v * (chart.y[i] ?? 0), 0)),
          );
        seam = Math.max(
          seam,
          distance(q, chartPoint(wing(t), [inward, outward, 0])),
          distance(chartPoint(wing(t), [inward, -outward, 0]), [inward, -outward, 0]),
          distance(chartPoint(wall(t), [0, outward, 0]), chartPoint(bridge(t), [0, outward, 0])),
        );
        if (n > 0 && n < 1000)
          clearance = Math.min(clearance, q[2] * Math.cos(a) - outward * q[1] * Math.sin(a));
        if (n === 500)
          expect(distance(q, [-inward / Math.SQRT2, -outward / Math.SQRT2, 1])).toBeLessThan(1e-12);
        if (n === 1000) expect(q).toEqual([-inward, -outward, 0]);
      }
    }
  expect(Math.max(rigid, seam)).toBeLessThan(1e-12);
  expect(clearance).toBeGreaterThan(0);
});
it("rejects a packet extending across the held diagonal", () =>
  expect(() =>
    prepareBoat(
      { kind: "boat-pocket", center: [0, 0], inward: 1, outward: 1, sector: "wing", landingPly: 2 },
      [[0.1, -0.6, 0]],
    ),
  ).toThrow(/sector/));
