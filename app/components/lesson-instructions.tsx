import { useI18n } from "../i18n/context";
import { useEffect, useRef, useState } from "react";
import type { Instruction, PlayerLesson } from "../lesson/use-lesson-player";
import { PlayerIcon } from "./player-icon";

const panelId = "lesson-instructions";
export function LessonInstructions({
  lesson,
  copy,
  label,
  complete,
  instant,
  pause,
}: {
  lesson: PlayerLesson;
  copy: Instruction;
  label: string;
  complete: boolean;
  instant: boolean;
  pause: () => void;
}) {
  const {
    common: { player: p },
    format,
  } = useI18n();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setEnhanced(true), []);
  const contents = (
    <>
      <header className="instruction-heading">
        <span className="instruction-step">{label}</span>
        <button
          ref={close}
          type="button"
          tabIndex={0}
          className="studio-icon-button"
          aria-label={p.close}
          title={p.close}
          popoverTarget={enhanced ? undefined : panelId}
          popoverTargetAction={enhanced ? undefined : "hide"}
          onTouchEnd={(event) => {
            // Chromium can consume the synthesized click to stop a scrolling transcript.
            const touch = event.changedTouches[0];
            if (!dialog.current?.open || !touch) return;
            const releasedOn = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!event.currentTarget.contains(releasedOn)) return;
            event.preventDefault();
            dialog.current.close();
          }}
          onClick={() => dialog.current?.close()}
        >
          <PlayerIcon name="close" />
        </button>
      </header>
      <div className="instruction-body" role="region" aria-label={p.instructions} tabIndex={0}>
        <h2 id="instruction-title">{copy.title}</h2>
        {copy === lesson.steps[0] && (
          <p className="sheet-preparation">{lesson.sheet.instruction}</p>
        )}
        <p className="current-instruction">{copy.instruction}</p>
        {complete && <p>{copy.result}</p>}
        <details className="lesson-transcript">
          <summary tabIndex={0}>{format(p.all, { n: lesson.steps.length })}</summary>
          <p>
            <strong>{lesson.sheet.title}</strong>
            <br />
            {lesson.sheet.instruction}
          </p>
          <ol>
            {lesson.steps.map((step) => (
              <li key={step.id} aria-current={step === copy ? "step" : undefined}>
                <strong>{step.title}</strong>
                <p>{step.instruction}</p>
                <p>{step.result}</p>
              </li>
            ))}
          </ol>
        </details>
        <p className="input-help" id="studio-gestures">
          {p.gestures}
        </p>
        {instant && <p className="input-help">{p.instant}</p>}
      </div>
    </>
  );
  return (
    <>
      <button
        ref={trigger}
        type="button"
        tabIndex={0}
        className="studio-info studio-icon-button"
        aria-label={p.info}
        title={p.info}
        aria-controls={panelId}
        aria-haspopup="dialog"
        aria-expanded={enhanced ? open : undefined}
        popoverTarget={enhanced ? undefined : panelId}
        onClick={() => {
          if (dialog.current) {
            pause();
            dialog.current.showModal();
            setOpen(true);
            close.current?.focus();
          }
        }}
      >
        <PlayerIcon name="info" />
      </button>
      {enhanced ? (
        <dialog
          ref={dialog}
          id={panelId}
          className="instruction-panel"
          aria-labelledby="instruction-title"
          onClose={() => {
            setOpen(false);
            trigger.current?.focus({ preventScroll: true });
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < left ||
              event.clientX > right ||
              event.clientY < top ||
              event.clientY > bottom
            )
              dialog.current?.close();
          }}
        >
          {contents}
        </dialog>
      ) : (
        <section
          id={panelId}
          popover="auto"
          role="dialog"
          className="instruction-panel"
          aria-labelledby="instruction-title"
        >
          {contents}
        </section>
      )}
    </>
  );
}
