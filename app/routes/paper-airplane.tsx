import { Link } from "react-router";
import { CameraControls } from "../components/camera-controls";
import { airplanePattern } from "../lesson/airplane";
import { airplaneText, sheetText } from "../lesson/airplane.en";
import { airplaneInfo } from "../lessons";
import { useLessonPlayer } from "../lesson/use-lesson-player";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";
import "./first-fold.css";

export const meta = () => [{ name: "description", content: airplaneInfo.summary }];
const lesson = {
  sheet: sheetText,
  steps: airplanePattern.steps.map(({ id, durationMs }) => ({
    id,
    durationMs,
    ...airplaneText[id],
  })),
  loadScene: () => import("../lesson/airplane-scene.client").then((module) => module.mountAirplane),
};
const total = lesson.steps.length;

export default function PaperAirplane() {
  const { host, meter, scene, status, command, cameraReading, moveCamera, announcement } =
    useLessonPlayer(lesson);
  const { number, copy, travel } = status;
  const loading = scene === "loading";
  const finished = number === total && travel === "rest";
  const stepLabel =
    number === 0
      ? "Starting sheet"
      : `${travel === "reverse" ? "Reversing step" : "Step"} ${number} of ${total}`;
  return (
    <article className="fold-lab airplane-lesson">
      <title>{pageTitle(airplaneInfo.title)}</title>
      <header className="studio-heading">
        <p className="eyebrow">
          {airplaneInfo.level} origami · {total} steps
        </p>
        <h1>{airplaneInfo.title}</h1>
      </header>
      <div className="lab-workbench">
        <div className="lab-view">
          <figure className="lab-figure">
            <div className="lab-stage">
              <div
                className="lab-canvas"
                ref={host}
                role="img"
                aria-hidden={scene !== "ready"}
                aria-label={travel === "rest" ? copy.result : copy.instruction}
                hidden={scene === "unavailable"}
              />
              {scene !== "ready" && (
                <div className="lab-placeholder">
                  <strong>{loading ? sheetText.title : "3D view unavailable"}</strong>
                  <p>{loading ? sheetText.instruction : copy.result}</p>
                  {loading && (
                    <p className="script-hint">
                      Read the complete instructions below, or enable JavaScript for playback.
                    </p>
                  )}
                </div>
              )}
            </div>
            <figcaption className="lab-key">
              <span>
                <i className="key-fixed" />
                Front
              </span>
              <span>
                <i className="key-back" />
                Reverse
              </span>
              {!finished && (
                <span>
                  <i className="key-guide" />
                  {travel === "rest" ? "Next crease" : "Current crease"}
                </span>
              )}
            </figcaption>
          </figure>
          <section className="transport" aria-label="Lesson playback">
            <div className="lab-angle">
              <label htmlFor="lesson-progress">Lesson progress</label>
              <span aria-hidden="true">
                {number} / {total}
              </span>
              <meter
                ref={meter}
                id="lesson-progress"
                min={0}
                max={total}
                value={0}
                aria-valuetext={stepLabel}
              />
            </div>
            <div className="lab-actions" role="group" aria-label="Fold controls">
              <button
                tabIndex={0}
                type="button"
                className="btn"
                disabled={loading}
                aria-disabled={loading || !status.canPrevious}
                onClick={() => command("previous")}
              >
                Previous
              </button>
              <button
                tabIndex={0}
                type="button"
                className="btn btn-primary"
                disabled={loading}
                aria-disabled={loading || !status.canNext}
                onClick={() => command("next")}
              >
                Next
              </button>
              <button
                tabIndex={0}
                type="button"
                className="btn replay"
                disabled={loading}
                onClick={() => command("replay")}
              >
                Replay
              </button>
            </div>
            <p className="lab-help">
              Previous reverses from here. Replay rewinds and repeats the current step.
            </p>
          </section>
        </div>
        <div className="lab-notes">
          <section className="lab-panel" aria-label="Fold instruction">
            <p className="category">{stepLabel}</p>
            <div className="pose">
              <h2>{copy.title}</h2>
              <p>{copy.instruction}</p>
              {finished && <p className="lesson-result">{copy.result}</p>}
            </div>
          </section>
          <CameraControls
            ready={scene === "ready"}
            reading={cameraReading}
            moveCamera={moveCamera}
          />
        </div>
      </div>
      <details className="lesson-transcript">
        <summary>Read all {total} steps</summary>
        <p>{sheetText.instruction}</p>
        <ol>
          {lesson.steps.map(({ id, title, instruction }) => (
            <li key={id}>
              <strong>{title}</strong>
              <p>{instruction}</p>
            </li>
          ))}
        </ol>
      </details>
      <Link tabIndex={0} className="text-link" to={englishPath("foundation")}>
        Back to Explore
      </Link>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
    </article>
  );
}
