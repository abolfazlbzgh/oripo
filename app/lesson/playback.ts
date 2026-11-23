import { clampProgress } from "../fold/geometry";
import type { FoldCommand } from "../fold/controller";
import { atIndex, type FoldStep } from "./geometry";

type Timing = readonly Pick<FoldStep, "durationMs">[];
export type LessonMotion = {
  step: number;
  from: number;
  target: 0 | 1;
  start: number;
  replay: boolean;
};
export const initialLessonMotion: LessonMotion = {
  step: 0,
  from: 0,
  target: 0,
  start: 0,
  replay: false,
};
export type Travel = "forward" | "reverse" | "rest";

export function sampleLesson(steps: Timing, motion: LessonMotion, now: number) {
  const elapsed = Math.max(0, now - motion.start) / atIndex(steps, motion.step).durationMs;
  const rewinding = motion.replay && elapsed < motion.from;
  const target = rewinding ? 0 : motion.target;
  const progress =
    motion.replay && !rewinding
      ? clampProgress(elapsed - motion.from)
      : clampProgress(motion.from + (target ? elapsed : -elapsed));
  const travel: Travel = progress === target ? "rest" : target ? "forward" : "reverse";
  const position = motion.step + progress;
  const canNext = travel === "rest" ? position < steps.length : travel === "reverse";
  const canPrevious = travel === "rest" ? position > 0 : travel === "forward" || rewinding;
  return { step: motion.step, progress, position, travel, canNext, canPrevious };
}

export function settleLesson(motion: LessonMotion): LessonMotion {
  return { ...motion, from: motion.target, replay: false };
}

export function commandLesson(
  steps: Timing,
  motion: LessonMotion,
  command: FoldCommand,
  now: number,
  instant = false,
): LessonMotion {
  const pose = sampleLesson(steps, motion, now);
  if ((command === "previous" && !pose.canPrevious) || (command === "next" && !pose.canNext))
    return motion;
  let step = pose.step;
  if (pose.travel === "rest") {
    step = command === "next" ? pose.position : Math.max(0, pose.position - 1);
  }
  const target = command === "previous" ? 0 : 1;
  const from = instant ? target : step === pose.step ? pose.progress : pose.position - step;
  return { step, from, target, start: now, replay: !instant && command === "replay" && from > 0 };
}
