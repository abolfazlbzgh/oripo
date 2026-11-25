import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useStudioView, type SettleReason, type StudioMount } from "../fold/use-studio-view";
import type { FoldView, Inspection } from "../fold/studio.client";
import { sameEye } from "./camera";
import { useI18n } from "../i18n/context";
import { numberLocale, type Common, type formatter, type Instruction } from "../i18n/messages";
export type { Instruction } from "../i18n/messages";
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
export type PlayerLesson = {
  sheet: Instruction;
  steps: readonly (Instruction & { id: string; durationMs: number })[];
  loadScene: () => Promise<StudioMount<Reading>>;
};

function statusOf(
  lesson: PlayerLesson,
  pose: Reading,
  p: Common["player"],
  format: ReturnType<typeof formatter>,
) {
  const { steps, sheet } = lesson;
  const { position, step, travel, canNext, canPrevious } = pose;
  const complete = pose.complete;
  const completedFolds = Math.floor(position);
  const copy = atIndex(steps, step);
  const boundary = Number.isInteger(position);
  const description = boundary
    ? (position === 0 ? sheet : atIndex(steps, position - 1)).result
    : copy.instruction;
  const label = complete ? p.finished : format(p.step, { n: step + 1, total: steps.length });
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
  const {
    common: { player: p },
    format,
    locale,
  } = useI18n();
  const { steps } = lesson;
  const motion = useRef(initialLessonMotion);
  const controls = useRef<FoldView | null>(null);
  const shown = useRef<Reading>(sampleLesson(steps, initialLessonMotion, 0));
  const gesturing = useRef(false);
  const displayed = useRef(0);
  const range = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(() =>
    statusOf(lesson, sampleLesson(steps, initialLessonMotion, 0), p, format),
  );
  const last = useRef(status);
  const [announcement, setAnnouncement] = useState("");

  // Fiber's demand frame also drives the scrubber. React only sees changes
  // that affect an instruction, command, or announcement.
  const sample = useCallback(
    (now: number) => {
      const guided = controls.current?.guided;
      const pose = sampleLesson(steps, motion.current, now, guided?.views);
      if (guided && pose.eye && !gesturing.current && !sameEye(guided.read(), pose.eye))
        guided.show(pose.eye);
      shown.current = pose;
      const { position, step, progress, travel } = pose;
      const prior = last.current;
      const languageChanged = prior.copy !== atIndex(steps, step) && prior.step === step;
      if (
        languageChanged ||
        displayed.current !== position ||
        prior.travel !== travel ||
        prior.complete !== pose.complete ||
        prior.step !== step ||
        prior.canNext !== pose.canNext ||
        prior.canPrevious !== pose.canPrevious
      ) {
        displayed.current = position;
        const next = statusOf(lesson, pose, p, format);
        const slider = range.current;
        if (slider) {
          slider.value = String(position);
          slider.style.setProperty("--played", (100 * position) / steps.length + "%");
          slider.setAttribute(
            "aria-valuetext",
            next.complete
              ? p.finished
              : position === 0
                ? p.starting
                : format(p.value, {
                    n: step + 1,
                    total: steps.length,
                    title: next.copy.title,
                    percent: Math.round(progress * 100),
                  }),
          );
        }
        if (
          languageChanged ||
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
                : format(p.reached, {
                    n: position,
                    total: steps.length,
                    description: next.description,
                  })
              : format(
                  travel === "reverse" ? p.reverse : travel === "rest" ? p.paused : p.showing,
                  { n: step + 1, total: steps.length, title: next.copy.title },
                );
          setAnnouncement(message);
        }
      }
      return pose;
    },
    [lesson, steps, p, format],
  );

  const settle = useCallback(
    (reason: SettleReason) => {
      motion.current = settleLesson(motion.current, displayed.current);
      const pose = sample(performance.now());
      if (reason === "unavailable")
        setAnnouncement(`${p.unavailable}. ${statusOf(lesson, pose, p, format).description}`);
    },
    [lesson, sample, p, format],
  );
  useLayoutEffect(() => {
    // Browsers may restore native form values across a reload before hydration.
    if (range.current) range.current.value = String(displayed.current);
    sample(performance.now());
  }, [sample]);
  const cameraText = useCallback(
    (bearing: number, elevation: number, zoom: number) =>
      format(p.reading, {
        bearing,
        elevation,
        zoom: zoom.toLocaleString(numberLocale(locale), {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }),
    [format, p, locale],
  );
  function inspect(event: Inspection) {
    const guided = controls.current?.guided;
    if (!guided) return;
    const pose = shown.current,
      now = performance.now();
    const active = pose.travel !== "rest",
      prev = motion.current;
    const index = pose.guide;
    gesturing.current = event === "start";
    const eye = event === "reset" ? atIndex(guided.views, index).position : guided.read();
    motion.current = {
      ...(active ? prev : seekLesson(steps, pose.position)),
      from: pose.position,
      start: now,
      eye,
      heldStep: active ? undefined : pose.step,
      heldGuide: active ? undefined : pose.guide,
      manualStep: event === "reset" ? undefined : gesturing.current ? "gesture" : index,
      finish: event !== "reset" && pose.unfinishedShowcase && pose.travel === "rest",
    };
    if (event === "reset") guided.show(eye);
    sample(now);
    controls.current?.invalidate();
  }
  const studio = useStudioView(lesson.loadScene, sample, settle, cameraText, inspect, controls);

  function command(action: LessonCommand) {
    const now = performance.now();
    const instant = studio.reduced.current || !studio.view.current;
    const pose = { ...shown.current, eye: controls.current?.guided?.read() ?? shown.current.eye };
    motion.current = commandLesson(
      steps,
      motion.current,
      action,
      now,
      instant,
      displayed.current,
      pose,
    );
    if (gesturing.current) motion.current = { ...motion.current, manualStep: "gesture" };
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
