import { createRoot, extend, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import {
  AmbientLight,
  BackSide,
  BufferGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  FrontSide,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { FoldPose } from "./controller";
import { crease, fixedPanel, hingeRotationY, movingPanel, type Panel } from "./geometry";

export type CameraAction = "left" | "right" | "up" | "down" | "closer" | "farther" | "reset";
export type FoldView = { invalidate: () => void; moveCamera: (action: CameraAction) => void };
type SceneCallbacks = {
  sample: (now: number) => FoldPose;
  ready: (view: FoldView) => void;
  cameraChanged: (bearing: number, elevation: number, zoom: number) => void;
  unavailable: () => void;
};

extend({
  AmbientLight,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  LineBasicMaterial,
  PlaneGeometry,
  ShadowMaterial,
});
const CreaseLine = extend(Line);

// Each group draws the same two triangles, culled to the corresponding side of the paper.
const PanelGeometry = extend(
  class extends BufferGeometry {
    constructor(panel: Panel) {
      super();
      this.setAttribute("position", new Float32BufferAttribute(panel.flat(), 3));
      this.setIndex([0, 1, 2, 0, 2, 3]);
      this.computeVertexNormals();
      this.addGroup(0, 6, 0);
      this.addGroup(0, 6, 1);
    }
  },
);

const CreaseGeometry = extend(
  class extends BufferGeometry {
    constructor() {
      super();
      this.setAttribute("position", new Float32BufferAttribute(crease.flat(), 3));
    }
  },
);

const cameraPosition: [number, number, number] = [1.35, -2.65, 3.55];
const homeDistance = Math.hypot(...cameraPosition);
const turn = Math.PI / 12;

function Paper({ sample, ready, cameraChanged }: SceneCallbacks) {
  const moving = useRef<Mesh>(null);
  const { gl, camera, invalidate } = useThree();

  useLayoutEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enablePan = false;
    orbit.minDistance = 3.6;
    orbit.maxDistance = 6.8;
    orbit.minPolarAngle = Math.PI / 24;
    orbit.maxPolarAngle = Math.PI / 2 - Math.PI / 24;
    orbit.cursorStyle = "grab";
    function reportView() {
      cameraChanged(
        orbit.getAzimuthalAngle(),
        Math.PI / 2 - orbit.getPolarAngle(),
        homeDistance / orbit.getDistance(),
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
  }, [camera, cameraChanged, gl, invalidate, ready]);

  useFrame(() => {
    const { progress, phase } = sample(performance.now());
    if (moving.current) moving.current.rotation.y = hingeRotationY(progress);
    if (phase === "folding" || phase === "unfolding") invalidate();
  });

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
      <mesh position-z={-0.035} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh castShadow receiveShadow>
        <PanelGeometry args={[fixedPanel]} />
        <meshStandardMaterial
          attach="material-0"
          side={FrontSide}
          color="#95b49f"
          roughness={1}
          polygonOffset
          polygonOffsetFactor={2}
          polygonOffsetUnits={2}
        />
        <meshStandardMaterial attach="material-1" side={BackSide} color="#849988" roughness={1} />
      </mesh>
      <mesh ref={moving} castShadow>
        <PanelGeometry args={[movingPanel]} />
        <meshStandardMaterial
          attach="material-0"
          side={FrontSide}
          color="#f1ddb0"
          roughness={1}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
        <meshStandardMaterial
          attach="material-1"
          side={BackSide}
          color="#dfb77d"
          roughness={1}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <CreaseLine renderOrder={1}>
        <CreaseGeometry />
        <lineBasicMaterial color="#294637" />
      </CreaseLine>
    </>
  );
}

export function mountFoldScene(host: HTMLDivElement, callbacks: SceneCallbacks) {
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
      camera: { position: cameraPosition, up: [0, 0, 1], fov: 40, near: 0.1, far: 30 },
      size: { width: host.clientWidth, height: host.clientHeight, top: 0, left: 0 },
      dpr: [1, 2],
      frameloop: "demand",
      shadows: "percentage",
      flat: true,
    })
    .then(() => {
      if (disposed) return;
      const store = root.render(<Paper {...callbacks} />);
      observer = new ResizeObserver(() => {
        if (!disposed) store.getState().setSize(host.clientWidth, host.clientHeight);
      });
      observer.observe(host);
    })
    .catch(fail);
  return dispose;
}
