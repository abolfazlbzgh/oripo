import { atIndex } from "./geometry";
import { useCallback, useRef, useState } from "react";
import type { FoldCommand } from "../fold/controller";
import { useStudioView, type SettleReason, type StudioMount } from "../fold/use-studio-view";
import { commandLesson, initialLessonMotion, sampleLesson, settleLesson } from "./playback";

type Reading = ReturnType<typeof sampleLesson>;
type Instruction = { title: string; instruction: string; result: string };
export type PlayerLesson = {
  sheet: Instruction;
  steps: readonly (Instruction & { id: string; durationMs: number })[];
  loadScene: () => Promise<StudioMount<Reading>>;
};
function statusOf(lesson: PlayerLesson, pose: Reading) {
  const number = pose.travel === "rest" ? Math.round(pose.position) : pose.step + 1;
  const copy = number ? atIndex(lesson.steps, number - 1) : lesson.sheet;
  return {
    number,
    copy,
    travel: pose.travel,
    canNext: pose.canNext,
    canPrevious: pose.canPrevious,
  };
}
export function useLessonPlayer(lesson: PlayerLesson) {
  const { steps } = lesson;
  const initialStatus = statusOf(lesson, sampleLesson(steps, initialLessonMotion, 0));
  const motion = useRef(initialLessonMotion);
  const meter = useRef<HTMLMeterElement>(null);
  const last = useRef(initialStatus);
  const [status, setStatus] = useState(initialStatus);
  const [announcement, setAnnouncement] = useState("");

  const sample = useCallback(
    (now: number) => {
      const pose = sampleLesson(steps, motion.current, now);
      if (meter.current) {
        meter.current.value = pose.position;
      }
      const next = statusOf(lesson, pose);
      const prior = last.current;
      if (
        prior.number !== next.number ||
        prior.travel !== next.travel ||
        prior.canPrevious !== next.canPrevious
      ) {
        last.current = next;
        setStatus(next);
        const action =
          next.travel === "reverse" ? "Reversing" : next.travel === "rest" ? "Reached" : "Showing";
        setAnnouncement(
          next.number
            ? `${action} step ${next.number} of ${steps.length}. ${next.copy.title}. ${next.travel === "rest" ? next.copy.result : next.copy.instruction}`
            : lesson.sheet.result,
        );
      }
      return pose;
    },
    [lesson, steps],
  );

  const settle = useCallback(
    (reason: SettleReason) => {
      motion.current = settleLesson(motion.current);
      const pose = sample(performance.now());
      if (reason === "unavailable")
        setAnnouncement(`3D view unavailable. ${statusOf(lesson, pose).copy.result}`);
    },
    [lesson, sample],
  );
  const studio = useStudioView(lesson.loadScene, sample, settle);

  function command(action: FoldCommand) {
    const now = performance.now();
    const instant = studio.reduced.current || !studio.view.current;
    motion.current = commandLesson(steps, motion.current, action, now, instant);
    const pose = sample(now);
    if (action === "replay" && instant)
      setAnnouncement(`Replay complete. ${statusOf(lesson, pose).copy.result}`);
    studio.view.current?.invalidate();
  }
  return { ...studio, meter, status, announcement, command };
}
