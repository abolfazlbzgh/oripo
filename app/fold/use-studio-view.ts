import { useEffect, useRef, useState } from "react";
import type { CameraAction, FoldView, StudioCallbacks } from "./studio.client";

export type StudioMount<T> = (
  host: HTMLDivElement,
  callbacks: StudioCallbacks & { sample: (now: number) => T; active: () => boolean },
) => undefined | (() => void);
export type SettleReason = "reduced" | "unavailable";

export function useStudioView<T>(
  load: () => Promise<StudioMount<T>>,
  sample: (now: number) => T,
  settle: (reason: SettleReason) => void,
) {
  const host = useRef<HTMLDivElement>(null);
  const cameraReading = useRef<HTMLParagraphElement>(null);
  const view = useRef<FoldView | null>(null);
  const reduced = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scene, setScene] = useState<"loading" | "ready" | "unavailable">("loading");

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
        settle("reduced");
        view.current?.invalidate();
      }
    }
    function unavailable() {
      if (closed || lost) return;
      lost = true;
      view.current = null;
      settle("unavailable");
      setScene("unavailable");
    }
    syncPreference();
    preference.addEventListener("change", syncPreference);
    void load()
      .then((mount) => {
        if (closed) return;
        dispose = mount(container, {
          sample,
          active: () => !closed && !lost,
          ready: (controls) => {
            if (closed || lost) return;
            view.current = controls;
            setScene("ready");
          },
          cameraChanged: (bearing, elevation, zoom) => {
            if (closed || lost || !cameraReading.current) return;
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
  }, [load, sample, settle]);
  function moveCamera(action: CameraAction) {
    view.current?.moveCamera(action);
  }
  return { host, cameraReading, view, reduced, reducedMotion, scene, moveCamera };
}
