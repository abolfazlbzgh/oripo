import type { KeyboardEvent } from "react";
import type { CameraAction } from "../fold/studio.client";
import { useLessonPlayer, type PlayerLesson } from "../lesson/use-lesson-player";
import { pageTitle } from "../site";
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
  ["closer", "plus", "Zoom in"],
  ["farther", "minus", "Zoom out"],
  ["reset", "reset", "Reset view"],
] as const;

export function LessonPage({ lesson, info }: { lesson: PlayerLesson; info: { title: string } }) {
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
    <article className="lesson-studio" aria-label={info.title + " folding studio"}>
      <title>{pageTitle(info.title)}</title>
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
          ref={host}
          role="img"
          tabIndex={ready ? 0 : -1}
          aria-hidden={!ready}
          aria-label={description}
          aria-describedby="studio-gestures"
          aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
          title="Drag or use arrow keys to orbit"
          onKeyDown={orbit}
          hidden={scene === "unavailable"}
        />
        {!ready && (
          <div className="studio-placeholder">
            <strong>{scene === "loading" ? lesson.sheet.title : "3D view unavailable"}</strong>
            <p>{scene === "loading" ? lesson.sheet.instruction : description}</p>
            <p>Open Info for the folding instructions.</p>
          </div>
        )}
      </div>
      <fieldset className="studio-camera" disabled={!ready} aria-label="Camera view">
        {viewButtons.map(([action, name, label]) => (
          <button
            type="button"
            tabIndex={0}
            className="studio-icon-button"
            key={action}
            title={label}
            aria-label={label}
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
