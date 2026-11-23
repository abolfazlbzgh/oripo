import { atIndex, type FoldStep } from "./geometry";

type Timing = readonly Pick<FoldStep, "durationMs">[];
export type LessonCommand = "next" | "previous" | "play" | "pause";
export type LessonMotion = {
  from: number;
  target: number;
  start: number;
  mode: "idle" | "step" | "all";
};

function paused(position: number): LessonMotion {
  return { from: position, target: position, start: 0, mode: "idle" };
}

export const initialLessonMotion = paused(0);

export function seekLesson(steps: Timing, position: number) {
  return paused(Number.isNaN(position) ? 0 : Math.max(0, Math.min(steps.length, position)));
}

// Every sample starts at the command's anchor, including after a throttled frame.
// One unit is an authored fold; each segment keeps its own duration.
export function sampleLesson(steps: Timing, motion: LessonMotion, now: number) {
  const { from, target } = motion;
  let elapsed = Math.max(0, now - motion.start);
  let position = from;
  const direction = Math.sign(target - from);
  while (position !== target && elapsed > 0) {
    const i = direction > 0 ? Math.floor(position) : Math.ceil(position) - 1;
    const end = direction > 0 ? Math.min(i + 1, target) : Math.max(i, target);
    const duration = atIndex(steps, i).durationMs;
    const remaining = Math.abs(end - position) * duration;
    if (elapsed < remaining) {
      position += (direction * elapsed) / duration;
      break;
    }
    position = end;
    elapsed -= remaining;
  }
  const travel = position === target ? "rest" : direction > 0 ? "forward" : "reverse";
  const step =
    travel === "reverse"
      ? Math.ceil(position) - 1
      : Math.min(Math.floor(position), steps.length - 1);
  return {
    position,
    step,
    progress: position - step,
    travel,
    canNext:
      (position < steps.length || travel === "reverse") &&
      !(motion.mode === "step" && travel === "forward"),
    canPrevious:
      (position > 0 || travel === "forward") && !(motion.mode === "step" && travel === "reverse"),
  } as const;
}

export function commandLesson(
  steps: Timing,
  motion: LessonMotion,
  command: LessonCommand,
  now: number,
  instant = false,
  displayed = sampleLesson(steps, motion, now).position,
): LessonMotion {
  if (command === "pause") return paused(displayed);
  if (command === "play") {
    const from = displayed === steps.length ? 0 : displayed;
    if (instant) return paused(displayed === steps.length ? 0 : steps.length);
    return { from, target: steps.length, start: now, mode: "all" };
  }
  const target =
    command === "next"
      ? Math.min(steps.length, Math.floor(displayed) + 1)
      : Math.max(0, Math.ceil(displayed) - 1);
  if (target === displayed || instant) return paused(target);
  if (motion.mode === "step" && motion.target === target) return motion;
  return { from: displayed, target, start: now, mode: "step" };
}

// Loss of motion/rendering finishes an explicitly requested single fold. During
// continuous play the last displayed pose is the reader's place in the lesson.
export function settleLesson(motion: LessonMotion, displayed: number) {
  return paused(motion.mode === "step" ? motion.target : displayed);
}
