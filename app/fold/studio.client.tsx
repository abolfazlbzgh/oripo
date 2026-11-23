import { createRoot, extend, useThree } from "@react-three/fiber";
import { useLayoutEffect, type ReactNode } from "react";
import {
  AmbientLight,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type CameraAction = "left" | "right" | "up" | "down" | "closer" | "farther" | "reset";
export type FoldView = { invalidate: () => void; moveCamera: (action: CameraAction) => void };
export type StudioCallbacks = {
  ready: (view: FoldView) => void;
  cameraChanged: (bearing: number, elevation: number, zoom: number) => void;
  unavailable: () => void;
};

extend({
  AmbientLight,
  Group,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
});

export type Viewpoint = {
  position: [number, number, number];
  minDistance: number;
  maxDistance: number;
  inspectBack?: boolean;
  shadowZ?: number;
};
const turn = Math.PI / 12;

function Studio({
  ready,
  cameraChanged,
  view,
  children,
}: StudioCallbacks & { view: Viewpoint; children: ReactNode }) {
  const { gl, camera, invalidate } = useThree();

  useLayoutEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enablePan = false;
    orbit.minDistance = view.minDistance;
    orbit.maxDistance = view.maxDistance;
    orbit.minPolarAngle = Math.PI / 24;
    orbit.maxPolarAngle = (view.inspectBack ? Math.PI : Math.PI / 2) - Math.PI / 24;
    orbit.cursorStyle = "grab";
    function reportView() {
      cameraChanged(
        orbit.getAzimuthalAngle(),
        Math.PI / 2 - orbit.getPolarAngle(),
        Math.hypot(...view.position) / orbit.getDistance(),
      );
      invalidate();
    }
    orbit.saveState();
    const move = {
      reset: () => orbit.reset(),
      left: () => orbit.rotateLeft(turn),
      right: () => orbit.rotateLeft(-turn),
      up: () => orbit.rotateUp(turn),
      down: () => orbit.rotateUp(-turn),
      closer: () => orbit.dollyIn(0.88),
      farther: () => orbit.dollyOut(0.88),
    };
    orbit.addEventListener("change", reportView);
    reportView();
    ready({ invalidate, moveCamera: (action) => move[action]() });
    return () => {
      orbit.removeEventListener("change", reportView);
      orbit.dispose();
    };
  }, [camera, cameraChanged, gl, invalidate, ready, view]);

  return (
    <>
      <ambientLight intensity={1.55} />
      <directionalLight
        position={[-2, -3, 5]}
        intensity={1.8}
        castShadow
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-normalBias={0.008}
        shadow-radius={3}
      />
      <mesh position-z={view.shadowZ ?? -0.035} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {children}
    </>
  );
}

export function mountStudio(
  host: HTMLDivElement,
  callbacks: StudioCallbacks,
  view: Viewpoint,
  paper: ReactNode,
) {
  const canvas = document.createElement("canvas");
  const options = { alpha: true, antialias: true };
  const context = canvas.getContext("webgl2", options);
  if (!context || !(context instanceof WebGL2RenderingContext)) {
    callbacks.unavailable();
    return;
  }

  const root = createRoot(canvas);
  let observer: ResizeObserver | undefined;
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener("webglcontextlost", fail);
    observer?.disconnect();
    root.unmount();
    canvas.remove();
  }
  function fail() {
    if (disposed) return;
    dispose();
    callbacks.unavailable();
  }

  host.append(canvas);
  canvas.addEventListener("webglcontextlost", fail);
  void root
    .configure({
      gl: () => new WebGLRenderer({ ...options, canvas, context }),
      camera: { position: view.position, up: [0, 0, 1], fov: 40, near: 0.1, far: 30 },
      size: { width: host.clientWidth, height: host.clientHeight, top: 0, left: 0 },
      dpr: [1, 2],
      frameloop: "demand",
      shadows: "percentage",
      flat: true,
    })
    .then(() => {
      if (disposed) return;
      const store = root.render(
        <Studio {...callbacks} view={view}>
          {paper}
        </Studio>,
      );
      observer = new ResizeObserver(() => {
        if (!disposed) store.getState().setSize(host.clientWidth, host.clientHeight);
      });
      observer.observe(host);
    })
    .catch(fail);
  return dispose;
}
