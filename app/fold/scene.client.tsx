import { extend, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import {
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  FrontSide,
  Line,
  LineBasicMaterial,
  type Mesh,
} from "three";
import type { FoldPose } from "./controller";
import { crease, fixedPanel, hingeRotationY, movingPanel, type Panel } from "./geometry";
import { mountStudio, type StudioCallbacks } from "./studio.client";

type SceneCallbacks = StudioCallbacks & { sample: (now: number) => FoldPose };
extend({ LineBasicMaterial });
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

function Paper({ sample }: Pick<SceneCallbacks, "sample">) {
  const moving = useRef<Mesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useFrame(() => {
    const { progress, phase } = sample(performance.now());
    if (moving.current) moving.current.rotation.y = hingeRotationY(progress);
    if (phase === "folding" || phase === "unfolding") invalidate();
  });

  return (
    <>
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
  return mountStudio(
    host,
    callbacks,
    { position: [1.35, -2.65, 3.55], minDistance: 3.6, maxDistance: 6.8 },
    <Paper sample={callbacks.sample} />,
  );
}
