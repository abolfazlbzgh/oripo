import { atIndex, type FoldStep } from "./geometry";
import type { Point } from "../fold/geometry";
import { orbitEye, revealMs, sameEye, type ViewCue } from "./camera";

type Timing = readonly Pick<FoldStep, "durationMs">[];
export type LessonCommand = "next" | "previous" | "play" | "pause";
export type LessonMotion = {
  from: number;
  target: number;
  start: number;
  mode: "idle" | "step" | "all";
  eye?: Point;
  heldStep?: number;
  heldGuide?: number;
  manualStep?: number | "gesture";
  finish?: boolean;
  resume?: { motion: LessonMotion; elapsedMs: number };
};

function paused(position: number): LessonMotion {
  return { from: position, target: position, start: 0, mode: "idle" };
}
export const initialLessonMotion = paused(0);
export function seekLesson(steps: Timing, position: number) {
  return paused(Number.isNaN(position) ? 0 : Math.max(0, Math.min(steps.length, position)));
}

export function sampleLesson(
  steps: Timing,
  motion: LessonMotion,
  now: number,
  views?: readonly ViewCue[],
) {
  const { from, target } = motion,
    direction = Math.sign(target - from);
  let elapsed = Math.max(0, now - motion.start),
    position = from;
  let eye = motion.eye ?? views?.[Math.floor(from)]?.position;
  function sample(step: number, phase: "fold" | "turn" | "reveal" | "finish" | "rest") {
    const travel = phase === "rest" ? "rest" : direction < 0 ? "reverse" : "forward";
    const guide =
      motion.heldGuide ?? (position === steps.length && travel !== "reverse" ? steps.length : step);
    const complete =
      position === steps.length &&
      phase === "rest" &&
      guide === steps.length &&
      !(motion.mode === "idle" && motion.finish);
    return {
      guide,
      complete,
      position,
      step,
      progress: position - step,
      travel,
      phase,
      eye,
      elapsedMs: Math.max(0, now - motion.start),
      unfinishedShowcase: phase === "finish" || (motion.mode === "idle" && !!motion.finish),
      canNext:
        (position < steps.length || travel === "reverse") &&
        !(motion.mode === "step" && travel === "forward"),
      canPrevious:
        (position > 0 || travel === "forward") && !(motion.mode === "step" && travel === "reverse"),
    } as const;
  }
  // Consume elapsed wall time across camera holds and unequal material durations.
  function orient(index: number, finish = false) {
    const cue = views?.[index];
    if (
      !cue ||
      !eye ||
      motion.manualStep === "gesture" ||
      motion.manualStep === index ||
      sameEye(eye, cue.position)
    )
      return;
    const step = Math.min(index, steps.length - 1);
    if (elapsed < cue.transitionMs) {
      eye = orbitEye(eye, cue.position, elapsed / cue.transitionMs);
      return sample(step, finish ? "finish" : "turn");
    }
    eye = cue.position;
    elapsed -= cue.transitionMs;
    if (!finish && elapsed < revealMs) return sample(step, "reveal");
    if (!finish) elapsed -= revealMs;
  }
  while (position !== target) {
    const i = direction > 0 ? Math.floor(position) : Math.ceil(position) - 1;
    const turning = orient(i);
    if (turning) return turning;
    const end = direction > 0 ? Math.min(i + 1, target) : Math.max(i, target);
    const duration = atIndex(steps, i).durationMs,
      remaining = Math.abs(end - position) * duration;
    if (elapsed < remaining) {
      position += (direction * elapsed) / duration;
      return sample(i, "fold");
    }
    position = end;
    elapsed -= remaining;
  }
  if (position === steps.length && motion.mode !== "idle") {
    const finishing = orient(steps.length, true);
    if (finishing) return finishing;
  }
  return sample(motion.heldStep ?? Math.min(Math.floor(position), steps.length - 1), "rest");
}
export type LessonReading = ReturnType<typeof sampleLesson>;

export function commandLesson(
  steps: Timing,
  motion: LessonMotion,
  command: LessonCommand,
  now: number,
  instant = false,
  displayed = sampleLesson(steps, motion, now).position,
  reading?: LessonReading,
): LessonMotion {
  if (command === "play" && !instant && motion.resume)
    return { ...motion.resume.motion, start: now - motion.resume.elapsedMs };
  if (command === "pause")
    return {
      ...paused(displayed),
      eye: reading?.eye,
      heldStep: reading?.step,
      heldGuide: reading?.guide,
      resume:
        reading && ["turn", "reveal", "finish"].includes(reading.phase)
          ? { motion, elapsedMs: reading.elapsedMs }
          : motion.resume,
      finish: reading?.phase === "finish" || (motion.mode === "idle" && motion.finish),
    };
  const replay =
    command === "play" &&
    displayed === steps.length &&
    !motion.finish &&
    reading?.phase !== "finish";
  const from = replay ? 0 : displayed;
  const target =
    command === "play"
      ? steps.length
      : command === "next"
        ? Math.min(steps.length, Math.floor(from) + 1)
        : Math.max(0, Math.ceil(from) - 1);
  if (instant) return paused(replay ? 0 : target);
  if (
    command !== "play" &&
    motion.mode === "step" &&
    motion.target === target &&
    reading?.travel !== "rest" &&
    from !== target
  )
    return motion;
  if (from === target && !(command === "play" && motion.finish))
    return { ...paused(target), eye: reading?.eye };
  return {
    from,
    target,
    start: now,
    mode: command === "play" ? "all" : "step",
    eye: replay ? undefined : reading?.eye,
  };
}

export function settleLesson(motion: LessonMotion, displayed: number) {
  return paused(motion.mode === "step" ? motion.target : displayed);
}
