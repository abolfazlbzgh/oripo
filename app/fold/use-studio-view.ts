import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import type { CameraAction, FoldView, StudioCallbacks } from "./studio.client";

export type StudioMount<T> = (
  host: HTMLDivElement,
  callbacks: StudioCallbacks & { sample: (now: number) => T; active: () => boolean },
) => undefined | (() => void);
export type SettleReason = "reduced" | "unavailable";

const defaultReading = (bearing: number, elevation: number, zoom: number) =>
  `${bearing}° around · ${elevation}° above · ${zoom.toFixed(2)}× zoom`;

export function useStudioView<T>(
  load: () => Promise<StudioMount<T>>,
  sample: (now: number) => T,
  settle: (reason: SettleReason) => void,
  formatReading = defaultReading,
) {
  const host = useRef<HTMLDivElement>(null);
  const cameraReading = useRef<HTMLParagraphElement>(null);
  const view = useRef<FoldView | null>(null);
  const reduced = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scene, setScene] = useState<"loading" | "ready" | "unavailable">("loading");

  // Locale changes update presentation callbacks while the same camera and canvas stay mounted.
  const readPose = useEffectEvent(sample);
  const settlePose = useEffectEvent(settle);
  const camera = useRef<[number, number, number] | null>(null);
  const writeReading = useEffectEvent(() => {
    if (cameraReading.current && camera.current)
      cameraReading.current.textContent = formatReading(...camera.current);
  });
  useLayoutEffect(() => {
    writeReading();
  }, [formatReading]);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let closed = false;
    let lost = false;
    let dispose: undefined | (() => void);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    function syncPreference() {
      reduced.current = preference.matches;
      setReducedMotion(preference.matches);
      if (reduced.current) {
        settlePose("reduced");
        view.current?.invalidate();
      }
    }
    function unavailable() {
      if (closed || lost) return;
      lost = true;
      view.current = null;
      settlePose("unavailable");
      setScene("unavailable");
    }
    syncPreference();
    preference.addEventListener("change", syncPreference);
    void load()
      .then((mount) => {
        if (closed) return;
        dispose = mount(container, {
          sample: readPose,
          active: () => !closed && !lost,
          ready: (controls) => {
            if (closed || lost) return;
            view.current = controls;
            setScene("ready");
          },
          cameraChanged: (bearing, elevation, zoom) => {
            if (closed || lost || !cameraReading.current) return;
            const degrees = (radians: number) => Math.round((radians * 180) / Math.PI);
            camera.current = [degrees(bearing), degrees(elevation), zoom];
            writeReading();
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
  }, [load]);
  function moveCamera(action: CameraAction) {
    view.current?.moveCamera(action);
  }
  return { host, cameraReading, view, reduced, reducedMotion, scene, moveCamera };
}
