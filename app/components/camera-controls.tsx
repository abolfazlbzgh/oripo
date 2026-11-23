import type { RefObject } from "react";
import type { CameraAction } from "../fold/studio.client";

const cameraGroups = [
  {
    title: "Orbit",
    controls: [
      ["left", "Left", "Orbit left"],
      ["right", "Right", "Orbit right"],
    ],
  },
  {
    title: "Tilt",
    controls: [
      ["up", "Up", "Tilt up"],
      ["down", "Down", "Tilt down"],
    ],
  },
  {
    title: "Zoom",
    controls: [
      ["farther", "−", "Zoom out"],
      ["closer", "+", "Zoom in"],
    ],
  },
] as const;

export function CameraControls({
  ready,
  reading,
  moveCamera,
}: {
  ready: boolean;
  reading: RefObject<HTMLParagraphElement | null>;
  moveCamera: (action: CameraAction) => void;
}) {
  return (
    <fieldset className="lab-camera" disabled={!ready}>
      <legend>Camera view</legend>
      <p>Drag to orbit. Pinch or scroll over the paper to zoom.</p>
      <div className="camera-tools">
        {cameraGroups.map((group) => (
          <div className="camera-pair" key={group.title}>
            <span>{group.title}</span>
            <div>
              {group.controls.map(([action, text, label]) => (
                <button
                  tabIndex={0}
                  type="button"
                  key={action}
                  aria-label={label}
                  title={label}
                  onClick={() => moveCamera(action)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button
          tabIndex={0}
          type="button"
          className="reset-view"
          onClick={() => moveCamera("reset")}
        >
          Reset view
        </button>
      </div>
      <p className="lab-reading" ref={reading} hidden={!ready} />
    </fieldset>
  );
}
