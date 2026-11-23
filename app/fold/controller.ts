import { clampProgress } from "./geometry";

export const foldDurationMs = 3000;
export type FoldPhase = "unfolded" | "folding" | "folded" | "unfolding";
export type FoldCommand = "next" | "previous" | "replay";
export type FoldMotion = Readonly<{ from: number; target: 0 | 1; startedAt: number }>;
export type FoldPose = Readonly<{ progress: number; phase: FoldPhase }>;
export const initialMotion: FoldMotion = { from: 0, target: 0, startedAt: 0 };

export function sampleFold(motion: FoldMotion, now: number): FoldPose {
  const elapsed = Math.max(0, now - motion.startedAt) / foldDurationMs;
  const delta = motion.target === 1 ? elapsed : -elapsed;
  const progress = clampProgress(motion.from + delta);
  if (progress === motion.target) {
    return { progress, phase: progress === 1 ? "folded" : "unfolded" };
  }
  return { progress, phase: motion.target === 1 ? "folding" : "unfolding" };
}

export function commandFold(
  motion: FoldMotion,
  command: FoldCommand,
  now: number,
  instant: boolean,
): FoldMotion {
  const target = command === "previous" ? 0 : 1;
  if (instant) return { from: target, target, startedAt: now };
  if (command === "replay") return { from: 0, target: 1, startedAt: now };
  if (target === motion.target) return motion;
  return { from: sampleFold(motion, now).progress, target, startedAt: now };
}
