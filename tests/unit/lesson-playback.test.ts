import { expect, it } from "vitest";
import { airplane } from "../../app/lesson/airplane";
import { atIndex, poseAt } from "../../app/lesson/geometry";
import {
  commandLesson,
  initialLessonMotion,
  sampleLesson,
  settleLesson,
} from "../../app/lesson/playback";

const { steps } = airplane;
it("reverses from the displayed fraction and ignores repeated commands to the same target", () => {
  let motion = commandLesson(steps, initialLessonMotion, "next", 0);
  expect(commandLesson(steps, motion, "next", 112)).toBe(motion);
  expect(commandLesson(steps, motion, "previous", 0)).toMatchObject({ from: 0, target: 0 });
  for (let t = 350; t < 800; t += 7) {
    const sample = sampleLesson(steps, motion, t);
    const action = sample.travel === "forward" ? "previous" : "next";
    motion = commandLesson(steps, motion, action, t);
    expect(sampleLesson(steps, motion, t).progress).toBe(sample.progress);
  }
});

it("rewinds a partial replay continuously, turns around at its start and permits interruption on either leg", () => {
  const next = commandLesson(steps, initialLessonMotion, "next", 0);
  const replay = commandLesson(steps, next, "replay", 800);
  expect(sampleLesson(steps, replay, 800)).toMatchObject({ progress: 0.5, travel: "reverse" });
  expect(sampleLesson(steps, replay, 1200)).toMatchObject({
    progress: 0.25,
    canNext: true,
    canPrevious: true,
  });
  const stopReplay = commandLesson(steps, replay, "previous", 1200);
  expect(sampleLesson(steps, stopReplay, 3000)).toMatchObject({ position: 0, travel: "rest" });
  expect(sampleLesson(steps, replay, 1600)).toMatchObject({ progress: 0, travel: "forward" });
  expect(sampleLesson(steps, replay, 2000)).toMatchObject({ progress: 0.25, travel: "forward" });
  expect(sampleLesson(steps, replay, 3200)).toMatchObject({ position: 1, travel: "rest" });
  const interrupted = commandLesson(steps, replay, "next", 1200);
  expect(sampleLesson(steps, interrupted, 1200)).toMatchObject({
    progress: 0.25,
    travel: "forward",
  });
  expect(sampleLesson(steps, interrupted, 2400)).toMatchObject({ position: 1, travel: "rest" });
});

it("settles reduced motion, text mode and an in-flight preference switch at the selected endpoint", () => {
  let motion = initialLessonMotion;
  for (let i = 0; i < steps.length; i++) {
    motion = commandLesson(steps, motion, "next", 0, true);
    expect(sampleLesson(steps, motion, 0)).toMatchObject({ position: i + 1, travel: "rest" });
  }
  expect(commandLesson(steps, motion, "next", 0)).toBe(motion);
  const replay = commandLesson(steps, motion, "replay", 0);
  expect(sampleLesson(steps, settleLesson(replay), 245)).toMatchObject({
    position: 9,
    travel: "rest",
  });
  expect(sampleLesson(steps, initialLessonMotion, 10000)).toMatchObject({
    position: 0,
    canPrevious: false,
  });
});

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
          if (pose.step !== i || pose.progress !== fraction / 2) throw Error("Timeline drift");
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
