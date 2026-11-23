import { useMemo, type KeyboardEvent } from "react";
import type { CameraAction } from "../fold/studio.client";
import { useLessonPlayer, type PlayerLesson } from "../lesson/use-lesson-player";
import { useI18n } from "../i18n/context";
import type { ModelId } from "../lessons";
import { LessonInstructions } from "./lesson-instructions";
import { LessonTransport } from "./lesson-transport";
import { PlayerIcon } from "./player-icon";
import "../lesson/studio.css";

const orbitKeys: Record<string, CameraAction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};
const viewButtons = [
  ["closer", "plus", "closer"],
  ["farther", "minus", "farther"],
  ["reset", "reset", "reset"],
] as const;

export function LessonPage({
  model,
  steps,
  loadScene,
}: {
  model: ModelId;
  steps: readonly { id: string; durationMs: number }[];
  loadScene: PlayerLesson["loadScene"];
}) {
  const { common, transcript, format } = useI18n();
  const p = common.player;
  const lesson = useMemo(() => {
    if (!transcript) throw new Error("Missing transcript for " + model);
    return {
      sheet: transcript.sheet,
      steps: steps.map(({ id, durationMs }) => {
        const copy = transcript.steps[id];
        if (!copy) throw new Error("Missing instruction " + id);
        return { id, durationMs, ...copy };
      }),
      loadScene,
    };
  }, [model, steps, loadScene, transcript]);
  const {
    host,
    range,
    scene,
    status,
    command,
    seek,
    cameraReading,
    moveCamera,
    reducedMotion,
    announcement,
  } = useLessonPlayer(lesson);
  const { copy, label, complete, travel, description } = status;
  const ready = scene === "ready";
  const instant = reducedMotion || scene === "unavailable";
  function orbit(event: KeyboardEvent<HTMLDivElement>) {
    const action = orbitKeys[event.key];
    if (action && ready) {
      event.preventDefault();
      moveCamera(action);
    }
  }
  return (
    <article
      className="lesson-studio"
      aria-label={format(p.studio, { model: common.models[model].title })}
    >
      <div className="studio-topline">
        <p className="step-indicator">{label}</p>
        <LessonInstructions
          lesson={lesson}
          copy={copy}
          label={label}
          complete={complete}
          instant={instant}
          pause={() => command("pause")}
        />
      </div>
      <div className="paper-field">
        <div
          className="studio-canvas"
          dir="ltr"
          ref={host}
          role="img"
          tabIndex={ready ? 0 : -1}
          aria-hidden={!ready}
          aria-label={description}
          aria-describedby="studio-gestures"
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
          title={p.orbit}
          onKeyDown={orbit}
          hidden={scene === "unavailable"}
        />
        {!ready && (
          <div className="studio-placeholder">
            <strong>{scene === "loading" ? lesson.sheet.title : p.unavailable}</strong>
            <p>{scene === "loading" ? lesson.sheet.instruction : description}</p>
            <p>{p.openInfo}</p>
          </div>
        )}
      </div>
      <fieldset className="studio-camera" disabled={!ready} aria-label={p.camera}>
        {viewButtons.map(([action, name, label]) => (
          <button
            type="button"
            tabIndex={0}
            className="studio-icon-button"
            key={action}
            title={p[label]}
            aria-label={p[label]}
            onClick={() => moveCamera(action)}
          >
            <PlayerIcon name={name} />
          </button>
        ))}
      </fieldset>
      <p className="sr-only lab-reading" ref={cameraReading} />
      <LessonTransport
        {...status}
        total={lesson.steps.length}
        title={copy.title}
        moving={travel !== "rest"}
        instant={instant}
        loading={scene === "loading"}
        range={range}
        command={command}
        seek={seek}
      />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </article>
  );
}
