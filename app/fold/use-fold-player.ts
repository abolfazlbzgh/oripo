import { useCallback, useEffect, useRef, useState } from "react";
import {
  commandFold,
  initialMotion,
  sampleFold,
  type FoldCommand,
  type FoldPhase,
} from "./controller";
import type { CameraAction, FoldView } from "./scene.client";

export function useFoldPlayer() {
  const host = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLMeterElement>(null);
  const angle = useRef<HTMLSpanElement>(null);
  const cameraReading = useRef<HTMLParagraphElement>(null);
  const view = useRef<FoldView | null>(null);
  const motion = useRef(initialMotion);
  const reduced = useRef(false);
  const lastPhase = useRef<FoldPhase>("unfolded");
  const [phase, setPhase] = useState<FoldPhase>("unfolded");
  const [scene, setScene] = useState<"loading" | "ready" | "unavailable">("loading");
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

  const command = useCallback(
    (action: FoldCommand) => {
      const now = performance.now();
      const instant = reduced.current || !view.current;
      motion.current = commandFold(motion.current, action, now, instant);
      sample(now);
      if (action === "replay" && instant)
        setAnnouncement("Replay complete. The two halves overlap.");
      view.current?.invalidate();
    },
    [sample],
  );

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let closed = false;
    let dispose: (() => void) | undefined;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function syncPreference() {
      reduced.current = preference.matches;
      if (reduced.current) command(motion.current.target ? "next" : "previous");
    }
    function unavailable() {
      if (closed) return;
      view.current = null;
      command(motion.current.target ? "next" : "previous");
      setScene("unavailable");
      setAnnouncement("3D view unavailable. Use the fold controls for a text description.");
    }
    syncPreference();
    preference.addEventListener("change", syncPreference);
    void import("./scene.client")
      .then(({ mountFoldScene }) => {
        if (closed) return;
        dispose = mountFoldScene(container, {
          sample,
          ready: (controls) => {
            if (closed) return;
            view.current = controls;
            setScene("ready");
          },
          cameraChanged: (bearing, elevation, zoom) => {
            if (!cameraReading.current) return;
            const degrees = (radians: number) => Math.round((radians * 180) / Math.PI);
            cameraReading.current.textContent = `${degrees(bearing)}° around · ${degrees(elevation)}° above · ${zoom.toFixed(2)}× zoom`;
          },
          unavailable,
        });
      })
      .catch(unavailable);
    return () => {
      closed = true;
      preference.removeEventListener("change", syncPreference);
      view.current = null;
      dispose?.();
    };
  }, [command, sample]);

  function moveCamera(action: CameraAction) {
    view.current?.moveCamera(action);
  }
  return { host, meter, angle, cameraReading, phase, scene, announcement, command, moveCamera };
}
