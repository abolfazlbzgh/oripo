import { useCallback, useRef, useState } from "react";
import { useStudioView, type SettleReason, type StudioMount } from "../fold/use-studio-view";
import { atIndex } from "./geometry";
import {
  commandLesson,
  initialLessonMotion,
  sampleLesson,
  seekLesson,
  settleLesson,
  type LessonCommand,
} from "./playback";

type Reading = ReturnType<typeof sampleLesson>;
export type Instruction = { title: string; instruction: string; result: string };
export type PlayerLesson = {
  sheet: Instruction;
  steps: readonly (Instruction & { id: string; durationMs: number })[];
  loadScene: () => Promise<StudioMount<Reading>>;
};

function statusOf(lesson: PlayerLesson, pose: Reading) {
  const { steps, sheet } = lesson;
  const { position, step, travel, canNext, canPrevious } = pose;
  const complete = position === steps.length && travel === "rest";
  const completedFolds = Math.floor(position);
  const copy = atIndex(steps, step);
  const boundary = Number.isInteger(position);
  const description = boundary
    ? (position === 0 ? sheet : atIndex(steps, position - 1)).result
    : copy.instruction;
  const label = complete ? "Lesson complete" : `Step ${step + 1} / ${steps.length}`;
  return {
    step,
    copy,
    completedFolds,
    complete,
    boundary,
    description,
    label,
    travel,
    canNext,
    canPrevious,
  };
}

export function useLessonPlayer(lesson: PlayerLesson) {
  const { steps } = lesson;
  const motion = useRef(initialLessonMotion);
  const displayed = useRef(0);
  const range = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(() =>
    statusOf(lesson, sampleLesson(steps, initialLessonMotion, 0)),
  );
  const last = useRef(status);
  const [announcement, setAnnouncement] = useState("");

  // Fiber's demand frame also drives the scrubber. React only sees changes
  // that affect an instruction, command, or announcement.
  const sample = useCallback(
    (now: number) => {
      const pose = sampleLesson(steps, motion.current, now);
      const { position, step, progress, travel } = pose;
      const prior = last.current;
      if (
        displayed.current !== position ||
        prior.travel !== travel ||
        prior.step !== step ||
        prior.canNext !== pose.canNext ||
        prior.canPrevious !== pose.canPrevious
      ) {
        displayed.current = position;
        const next = statusOf(lesson, pose);
        const slider = range.current;
        if (slider) {
          slider.value = String(position);
          slider.style.setProperty("--played", (100 * position) / steps.length + "%");
          slider.setAttribute(
            "aria-valuetext",
            next.complete
              ? "Lesson complete"
              : `Step ${step + 1} of ${steps.length}, ${next.copy.title}, ${Math.round(progress * 100)}% folded`,
          );
        }
        if (
          prior.step !== step ||
          prior.travel !== travel ||
          prior.boundary !== next.boundary ||
          prior.completedFolds !== next.completedFolds ||
          prior.complete !== next.complete ||
          prior.canNext !== next.canNext ||
          prior.canPrevious !== next.canPrevious
        ) {
          last.current = next;
          setStatus(next);
          const message =
            next.boundary && travel === "rest"
              ? position === 0
                ? lesson.sheet.result
                : `Reached step ${position} of ${steps.length}. ${next.description}`
              : `${travel === "reverse" ? "Reversing" : travel === "rest" ? "Paused at" : "Showing"} step ${step + 1} of ${steps.length}. ${next.copy.title}.`;
          setAnnouncement(message);
        }
      }
      return pose;
    },
    [lesson, steps],
  );

  const settle = useCallback(
    (reason: SettleReason) => {
      motion.current = settleLesson(motion.current, displayed.current);
      const pose = sample(performance.now());
      if (reason === "unavailable")
        setAnnouncement(`3D view unavailable. ${statusOf(lesson, pose).description}`);
    },
    [lesson, sample],
  );
  const studio = useStudioView(lesson.loadScene, sample, settle);

  function command(action: LessonCommand) {
    const now = performance.now();
    const instant = studio.reduced.current || !studio.view.current;
    motion.current = commandLesson(steps, motion.current, action, now, instant, displayed.current);
    sample(now);
    studio.view.current?.invalidate();
  }
  function seek(position: number) {
    motion.current = seekLesson(steps, position);
    sample(performance.now());
    studio.view.current?.invalidate();
  }
  return { ...studio, range, status, announcement, command, seek };
}
