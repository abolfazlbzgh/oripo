import { CameraControls } from "../components/camera-controls";
import { Link } from "react-router";
import { useFoldPlayer } from "../fold/use-fold-player";
import { englishPath } from "../navigation";
import { pageTitle } from "../site";
import "./first-fold.css";

const poses = {
  unfolded: [
    "Starting position",
    "Unfolded",
    "Keep the green half still. Bring the cream edge across the center crease to meet the opposite edge.",
  ],
  folding: [
    "In motion",
    "Folding",
    "The cream half lifts toward you, passes upright, and lowers onto the green half.",
  ],
  folded: [
    "Finished position",
    "Folded",
    "The two outside edges meet. The warm reverse side faces up, covering the fixed half.",
  ],
  unfolding: [
    "In motion",
    "Unfolding",
    "The moving half follows the same arc back to the right until the sheet lies flat.",
  ],
} as const;

export default function FirstFold() {
  const { host, meter, angle, cameraReading, phase, scene, announcement, command, moveCamera } =
    useFoldPlayer();
  const [step, heading, description] = poses[phase];
  const loading = scene === "loading";
  const forward = phase === "folding" || phase === "folded";
  return (
    <article className="fold-lab">
      <title>{pageTitle("The first fold")}</title>
      <header className="studio-heading">
        <p className="eyebrow">3D fold studio</p>
        <h1>The first fold</h1>
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
                  {loading && (
                    <p className="script-hint">
                      Enable JavaScript to operate the fold and camera controls.
                    </p>
                  )}
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
          <section className="transport" aria-label="Fold playback">
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
                tabIndex={0}
                type="button"
                className="btn"
                disabled={loading}
                aria-disabled={!forward || loading}
                onClick={() => forward && command("previous")}
              >
                Previous
              </button>
              <button
                tabIndex={0}
                type="button"
                className="btn btn-primary"
                disabled={loading}
                aria-disabled={forward || loading}
                onClick={() => !forward && command("next")}
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
                <svg
                  aria-hidden="true"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" />
                </svg>
                Replay
              </button>
            </div>
            <p className="lab-help">
              Previous reverses the fold at any angle. Replay starts from flat.
            </p>
          </section>
        </div>
        <div className="lab-notes">
          <section className="lab-panel" aria-label="Fold instruction">
            <p className="category">Valley fold · One crease</p>
            <div className="pose">
              <p className="lab-step">{step}</p>
              <h2>{heading}</h2>
              <p>{description}</p>
            </div>
          </section>
          <CameraControls
            ready={scene === "ready"}
            reading={cameraReading}
            moveCamera={moveCamera}
          />
        </div>
      </div>
      <Link tabIndex={0} className="text-link" to={englishPath("foundation")}>
        Back to Explore
      </Link>
      <span className="sr-only" role="status" aria-atomic="true">
        {announcement}
      </span>
    </article>
  );
}
