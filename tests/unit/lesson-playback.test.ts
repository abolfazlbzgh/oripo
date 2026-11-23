import { expect, it } from "vitest";
import { airplane } from "../../app/lesson/airplane";
import { atIndex, compileLesson, poseAt, tolerance } from "../../app/lesson/geometry";
import { diamond, flatPattern } from "../../app/lesson/flat-pattern";
import { foxFolds } from "../../app/lesson/fox";
import { heartFolds } from "../../app/lesson/heart";
import {
  commandLesson,
  initialLessonMotion,
  sampleLesson,
  seekLesson,
  settleLesson,
} from "../../app/lesson/playback";

const { steps } = airplane;
it("reverses the displayed fraction, ignoring repeated commands to the same destination", () => {
  let motion = commandLesson(steps, initialLessonMotion, "next", 0);
  expect(commandLesson(steps, motion, "next", 112)).toBe(motion);
  expect(commandLesson(steps, motion, "previous", 0)).toMatchObject({ from: 0, target: 0 });
  for (let t = 350; t < 800; t += 7) {
    const sample = sampleLesson(steps, motion, t);
    motion = commandLesson(steps, motion, sample.travel === "forward" ? "previous" : "next", t);
    expect(sampleLesson(steps, motion, t).position).toBe(sample.position);
  }
});

it("continues through unequal durations from a partial fold and completes on a delayed frame", () => {
  const motion = commandLesson(steps, seekLesson(steps, 1.75), "play", 100);
  expect(sampleLesson(steps, motion, 500)).toMatchObject({
    step: 2,
    progress: 0,
    travel: "forward",
  });
  expect(sampleLesson(steps, motion, 1250).position).toBe(2.5);
  expect(sampleLesson(steps, motion, 100000)).toMatchObject({
    position: 9,
    progress: 1,
    travel: "rest",
  });
});

it("pauses, reverses and resumes from the rendered pose even between frames", () => {
  const start = commandLesson(steps, initialLessonMotion, "play", 0);
  const frozen = commandLesson(steps, start, "pause", 850, false, 0.5);
  expect(sampleLesson(steps, frozen, 90000).position).toBe(0.5);
  const reverse = commandLesson(steps, frozen, "previous", 2000);
  const forward = commandLesson(steps, reverse, "play", 2400);
  expect(sampleLesson(steps, forward, 2400).position).toBe(0.25);
  expect(sampleLesson(steps, forward, 3600).position).toBe(1);
  const single = commandLesson(steps, forward, "next", 4000);
  expect(sampleLesson(steps, single, 100000).position).toBe(2);
});

it("seeks without a pending target, clamps outside the sheet and replays only by explicit command", () => {
  for (const [input, expected] of [
    [-Infinity, 0],
    [Infinity, 9],
    [NaN, 0],
    [3.125, 3.125],
  ] as const)
    expect(sampleLesson(steps, seekLesson(steps, input), 30000).position).toBe(expected);
  const end = seekLesson(steps, 9);
  expect(sampleLesson(steps, end, 1000)).toMatchObject({ canNext: false, travel: "rest" });
  const replay = commandLesson(steps, end, "play", 2000);
  expect(sampleLesson(steps, replay, 2000)).toMatchObject({ position: 0, travel: "forward" });
  expect(sampleLesson(steps, replay, 2800).position).toBe(0.5);
  expect(sampleLesson(steps, initialLessonMotion, 100000)).toMatchObject({
    position: 0,
    canPrevious: false,
    travel: "rest",
  });
});

it("provides instant manual endpoints and a labeled finish/start alternative without motion or WebGL", () => {
  const mid = seekLesson(steps, 3.375);
  expect(commandLesson(steps, mid, "next", 5, true).from).toBe(4);
  expect(commandLesson(steps, mid, "previous", 5, true).from).toBe(3);
  const end = commandLesson(steps, mid, "play", 5, true);
  expect(end).toMatchObject({ from: 9, mode: "idle" });
  expect(commandLesson(steps, end, "play", 6, true)).toEqual(initialLessonMotion);
  expect(settleLesson(commandLesson(steps, mid, "previous", 10), 3.2).from).toBe(3);
  expect(settleLesson(commandLesson(steps, mid, "play", 10), 3.6).from).toBe(3.6);
  expect(settleLesson(mid, 3.375)).toEqual(mid);
});

it("starts a newly mounted lesson at zero independently of a retired renderer's clock", () => {
  const old = commandLesson(steps, seekLesson(steps, 7.5), "play", 0);
  const held = settleLesson(old, 7.75);
  const fresh = commandLesson(foxFolds, initialLessonMotion, "next", 90000);
  expect(sampleLesson(foxFolds, fresh, 90000)).toMatchObject({ position: 0, step: 0 });
  expect(sampleLesson(steps, held, 99999)).toMatchObject({ position: 7.75, travel: "rest" });
  expect(sampleLesson(steps, initialLessonMotion, 99999)).toMatchObject({
    position: 0,
    travel: "rest",
  });
});

const models = [
  airplane,
  compileLesson(flatPattern("heart", diamond, heartFolds)),
  compileLesson(flatPattern("fox", diamond, foxFolds)),
];
it.each(models)(
  "resolves arbitrary seeks against independent first-crease coordinates in $lessonId",
  (model) => {
    const rest = atIndex(model.poses, 0);
    const fox = model.lessonId === "fox";
    for (const fraction of [0.5, 0.1973, 0.941, 0.1973]) {
      const s = sampleLesson(model.steps, seekLesson(model.steps, fraction), 95000);
      const actual = poseAt(model, s.step, s.progress);
      const theta = Math.PI * fraction;
      rest.forEach(([x, y, z], v) => {
        const moving = fox ? y : x;
        const expected =
          moving <= 0
            ? [x, y, z]
            : fox
              ? [x, y * Math.cos(theta), y * Math.sin(theta)]
              : [x * Math.cos(theta), y, x * Math.sin(theta)];
        const point = atIndex(actual, v);
        expect(Math.hypot(...point.map((n, k) => n - atIndex(expected, k)))).toBeLessThan(
          tolerance,
        );
      });
      for (const { a, b } of model.edges) {
        const length = (pose: typeof actual) =>
          Math.hypot(...atIndex(pose, a).map((n, k) => n - atIndex(atIndex(pose, b), k)));
        expect(Math.abs(length(actual) - length(rest))).toBeLessThan(tolerance);
      }
      for (const vertex of model.creases.get(atIndex(atIndex(model.steps, 0).turns, 0).crease) ??
        [])
        expect(atIndex(actual, vertex)).toEqual(atIndex(rest, vertex));
    }
  },
);

it("retraces every half-step and boundary over 1,000 complete forward and backward flights", () => {
  const expected = steps.map((_, i) => [
    poseAt(airplane, i, 0),
    poseAt(airplane, i, 0.5),
    poseAt(airplane, i, 1),
  ]);
  let motion = initialLessonMotion,
    now = 0,
    maxDrift = 0;
  for (let cycle = 0; cycle < 1000; cycle++) {
    for (const direction of ["next", "previous"] as const) {
      for (let n = 0; n < steps.length; n++) {
        const i = direction === "next" ? n : steps.length - 1 - n;
        motion = commandLesson(steps, motion, direction, now);
        for (const half of [1, 2]) {
          now += atIndex(steps, i).durationMs / 2;
          const pose = sampleLesson(steps, motion, now);
          const fraction = direction === "next" ? half : 2 - half;
          if (pose.position !== i + fraction / 2) throw Error("Timeline drift");
          const actual = poseAt(airplane, pose.step, pose.progress);
          const reference = atIndex(atIndex(expected, i), fraction);
          actual.forEach((point, v) =>
            point.forEach((x, k) => {
              maxDrift = Math.max(maxDrift, Math.abs(x - atIndex(atIndex(reference, v), k)));
            }),
          );
        }
      }
    }
  }
  expect(maxDrift).toBe(0);
  expect(sampleLesson(steps, motion, now).position).toBe(0);
});
