import { useCallback, useRef, useState } from "react";
import {
  commandFold,
  initialMotion,
  sampleFold,
  type FoldCommand,
  type FoldPhase,
} from "./controller";
import { useStudioView, type SettleReason } from "./use-studio-view";

const load = () => import("./scene.client").then((module) => module.mountFoldScene);

export function useFoldPlayer() {
  const meter = useRef<HTMLMeterElement>(null);
  const angle = useRef<HTMLSpanElement>(null);
  const motion = useRef(initialMotion);
  const lastPhase = useRef<FoldPhase>("unfolded");
  const [phase, setPhase] = useState<FoldPhase>("unfolded");
  const [announcement, setAnnouncement] = useState("");

  const sample = useCallback((now: number) => {
    const pose = sampleFold(motion.current, now);
    const degrees = pose.progress * 180;
    const rounded = Math.round(degrees);
    if (meter.current) {
      meter.current.value = degrees;
      meter.current.setAttribute("aria-valuetext", `${rounded} degrees`);
    }
    if (angle.current) angle.current.textContent = `${rounded}°`;
    if (pose.phase !== lastPhase.current) {
      lastPhase.current = pose.phase;
      setPhase(pose.phase);
      setAnnouncement(
        pose.phase === "folded"
          ? "Fold complete. The two halves overlap."
          : pose.phase === "unfolded"
            ? "Unfolded. The sheet is square again."
            : "",
      );
    }
    return pose;
  }, []);

  const settle = useCallback(
    (reason: SettleReason) => {
      const now = performance.now();
      motion.current = {
        from: motion.current.target,
        target: motion.current.target,
        startedAt: now,
      };
      sample(now);
      if (reason === "unavailable")
        setAnnouncement("3D view unavailable. Use the fold controls for a text description.");
    },
    [sample],
  );
  const studio = useStudioView(load, sample, settle);
  function command(action: FoldCommand) {
    const now = performance.now();
    const instant = studio.reduced.current || !studio.view.current;
    motion.current = commandFold(motion.current, action, now, instant);
    sample(now);
    if (action === "replay" && instant) setAnnouncement("Replay complete. The two halves overlap.");
    studio.view.current?.invalidate();
  }
  return { ...studio, meter, angle, phase, announcement, command };
}
