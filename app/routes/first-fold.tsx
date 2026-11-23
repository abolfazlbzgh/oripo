import { Link } from "react-router";
import { useFoldPlayer } from "../fold/use-fold-player";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";
import "./first-fold.css";

const steps = {
  unfolded: [
    "Step 1 of 2",
    "Unfolded",
    "The sheet is a square. Its two halves meet at the center crease.",
  ],
  folding: [
    "Step 1 to 2",
    "Folding",
    "The right edge lifts toward you, passes upright and lowers onto the left edge.",
  ],
  folded: [
    "Step 2 of 2",
    "Folded",
    "The two outside edges meet. The warm reverse side faces up, covering the fixed half.",
  ],
  unfolding: [
    "Step 2 to 1",
    "Unfolding",
    "The moving half follows the same arc back to the right.",
  ],
} as const;

const cameraButtons = [
  ["left", "Orbit left"],
  ["right", "Orbit right"],
  ["up", "Tilt up"],
  ["down", "Tilt down"],
  ["closer", "Zoom in"],
  ["farther", "Zoom out"],
] as const;

export default function FirstFold() {
  const { host, meter, angle, cameraReading, phase, scene, announcement, command, moveCamera } =
    useFoldPlayer();
  const [step, heading, description] = steps[phase];
  const loading = scene === "loading";
  const forward = phase === "folding" || phase === "folded";

  return (
    <article className="fold-lab">
      <title>{pageTitle("The first fold")}</title>
      <Link className="link" to={englishPath("foundation")}>
        Back to foundation
      </Link>
      <header className="lab-heading">
        <p className="eyebrow">Fold laboratory</p>
        <h1>The first fold</h1>
        <p>
          Keep the green half still. Fold the cream half over the center crease until the two
          outside edges meet.
        </p>
      </header>
      <div className="lab-workbench">
        <figure className="lab-figure">
          <div className="lab-stage">
            <div
              className="lab-canvas"
              ref={host}
              role="img"
              aria-hidden={scene !== "ready"}
              aria-label={`3D paper view. ${description}`}
              hidden={scene === "unavailable"}
            />
            {scene !== "ready" && (
              <div className="lab-placeholder">
                <strong>{loading ? "The unfolded sheet" : "3D view unavailable"}</strong>
                <p>
                  {loading
                    ? "A center crease divides the square into two equal rectangles. At 180°, the right half covers the left."
                    : "Use Next and Previous to explore both paper positions in the step description."}
                </p>
                {loading && <p>Enable JavaScript to operate the fold and camera controls.</p>}
              </div>
            )}
          </div>
          <figcaption className="lab-key">
            <span>
              <i className="key-fixed" />
              Fixed half
            </span>
            <span>
              <i className="key-moving" />
              Moving half
            </span>
            <span>
              <i className="key-crease" />
              Center crease
            </span>
          </figcaption>
        </figure>
        <section className="lab-panel" aria-label="Fold playback">
          <p className="lab-step">{step}</p>
          <h2>{heading}</h2>
          <p>{description}</p>
          <div className="lab-angle">
            <label htmlFor="fold-angle">Fold angle</label>
            <span ref={angle} aria-hidden="true">
              0°
            </span>
            <meter
              ref={meter}
              id="fold-angle"
              min={0}
              max={180}
              value={0}
              aria-valuetext="0 degrees"
            >
              0 degrees
            </meter>
          </div>
          <div className="lab-actions" role="group" aria-label="Fold controls">
            <button
              type="button"
              className="btn"
              disabled={loading || !forward}
              onClick={() => command("previous")}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || forward}
              onClick={() => command("next")}
            >
              Next
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={loading}
              onClick={() => command("replay")}
            >
              Replay
            </button>
          </div>
          <p className="lab-help">
            Next folds the sheet. Previous reverses it at any point. Replay starts over from flat.
          </p>
        </section>
      </div>
      <fieldset className="lab-camera" disabled={scene !== "ready"}>
        <legend>Camera view</legend>
        <p>Drag to orbit. Pinch or scroll to zoom. You can also use these buttons.</p>
        <div className="lab-camera-actions">
          {cameraButtons.map(([action, label]) => (
            <button type="button" className="btn" key={action} onClick={() => moveCamera(action)}>
              {label}
            </button>
          ))}
        </div>
        <p className="lab-reading" ref={cameraReading} hidden={scene !== "ready"} />
      </fieldset>
      <span className="sr-only" role="status" aria-atomic="true">
        {announcement}
      </span>
    </article>
  );
}
