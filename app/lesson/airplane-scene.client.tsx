import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import {
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  FrontSide,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from "three";
import type { Point } from "../fold/geometry";
import { mountStudio, type StudioCallbacks } from "../fold/studio.client";
import { airplane } from "./airplane";
import { atIndex, difference, poseAt, rotate, turnAngle, type Pose } from "./geometry";
import type { sampleLesson } from "./playback";

type Sample = (now: number) => ReturnType<typeof sampleLesson>;
const { faces, steps, creases } = airplane;

// Virtual hinge heights in plies, above the XY plane of the flat packets.
// Rotating the previous drawing offsets also reverses the order of a folded stack.
const hingeHeights: Record<string, number> = {
  spine: 0.5,
  "left-corner": 0.5,
  "right-corner": 0.5,
  "left-taper": 1.5,
  "right-taper": 1.5,
  "left-wing": 0,
  "right-wing": 0,
};
function foldOffsets(start: Pose, step: number, progress: number): Pose {
  const result = [...start];
  const action = atIndex(steps, step);
  for (const turn of action.turns) {
    const height = action.id === "close-body" ? 4 : hingeHeights[turn.crease];
    if (height === undefined) throw new Error(`Missing drawing height for ${turn.crease}`);
    const origin: Point = [0, 0, height * 0.0007];
    const angle = turnAngle(turn.degrees, progress);
    for (const f of turn.faces) result[f] = rotate(atIndex(start, f), origin, turn.axis, angle);
  }
  return result;
}
const offsets: Pose[] = [faces.map(() => [0, 0, 0])];
for (let i = 0; i < steps.length; i++) offsets.push(foldOffsets(atIndex(offsets, i), i, 1));

const outlines = faces.map(() => [] as { a: number; b: number; appearsAfter: number }[]);
for (const edge of airplane.edges) {
  let appearsAfter = -1;
  const [first, second] = edge.faces;
  if (first !== undefined && second !== undefined) {
    const action = steps.findIndex(
      ({ turns }) =>
        turns.findIndex((t) => t.faces.includes(first)) !==
        turns.findIndex((t) => t.faces.includes(second)),
    );
    appearsAfter = action < 0 ? Infinity : action;
  }
  for (const f of edge.faces) atIndex(outlines, f).push({ a: edge.a, b: edge.b, appearsAfter });
}

function geometryWithPositions(count: number) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
  return geometry;
}

function makePaper() {
  const group = new Group();
  const materials = [
    new MeshStandardMaterial({
      color: "#99b9a3",
      side: FrontSide,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
    new MeshStandardMaterial({
      color: "#e4b77d",
      side: BackSide,
      roughness: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  ];
  const ink = new LineBasicMaterial({
    color: "#374e40",
    depthWrite: false,
    transparent: true,
    opacity: 0.62,
  });
  const guideInk = new LineDashedMaterial({
    color: "#864529",
    dashSize: 0.055,
    gapSize: 0.04,
    depthTest: false,
    depthWrite: false,
  });
  const guide = new Line(geometryWithPositions(2), guideInk);
  guide.geometry.setAttribute("lineDistance", new Float32BufferAttribute([0, 1], 1));
  guide.renderOrder = 2;
  guide.frustumCulled = false;
  group.add(guide);

  const panels = faces.map(({ vertices }, f) => {
    const geometry = geometryWithPositions(vertices.length);
    const triangles: number[] = [];
    for (let i = 1; i < vertices.length - 1; i++) triangles.push(0, i, i + 1);
    geometry.setIndex(triangles);
    geometry.addGroup(0, triangles.length, 0);
    geometry.addGroup(0, triangles.length, 1);
    const mesh = new Mesh(geometry, materials);
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    const outline = new LineSegments(geometryWithPositions(2 * atIndex(outlines, f).length), ink);
    outline.frustumCulled = false;
    outline.renderOrder = 1;
    mesh.add(outline);
    group.add(mesh);
    return { mesh, outline, vertices };
  });
  let lastPosition = -1;
  let lastGuide = -1;
  function draw({ step, progress, position, travel }: ReturnType<Sample>) {
    const guideStep = travel === "rest" ? position : step;
    if (position === lastPosition && guideStep === lastGuide) return;
    lastPosition = position;
    lastGuide = guideStep;
    const pose = poseAt(airplane, step, progress);
    const separation =
      progress === 0 || progress === 1
        ? atIndex(offsets, step + progress)
        : foldOffsets(atIndex(offsets, step), step, progress);
    for (const [f, { mesh, outline, vertices }] of panels.entries()) {
      mesh.position.set(...atIndex(separation, f));
      const surface = mesh.geometry.getAttribute("position");
      vertices.forEach((v, i) => surface.setXYZ(i, ...atIndex(pose, v)));
      surface.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      const stroke = outline.geometry.getAttribute("position");
      let count = 0;
      for (const edge of atIndex(outlines, f)) {
        if (position <= edge.appearsAfter) continue;
        stroke.setXYZ(count++, ...atIndex(pose, edge.a));
        stroke.setXYZ(count++, ...atIndex(pose, edge.b));
      }
      outline.geometry.setDrawRange(0, count);
      stroke.needsUpdate = true;
    }
    guide.visible = guideStep < steps.length;
    if (guide.visible) {
      const crease = atIndex(atIndex(steps, guideStep).turns, 0).crease;
      const ends = creases.get(crease);
      if (!ends) throw new Error(`Missing guide for ${crease}`);
      const [a, b] = ends;
      const line = guide.geometry.getAttribute("position");
      line.setXYZ(0, ...atIndex(pose, a));
      line.setXYZ(1, ...atIndex(pose, b));
      line.needsUpdate = true;
      const d = guide.geometry.getAttribute("lineDistance");
      d.setX(1, Math.hypot(...difference(atIndex(pose, a), atIndex(pose, b))));
      d.needsUpdate = true;
    }
  }
  function dispose() {
    for (const { mesh, outline } of panels) {
      mesh.geometry.dispose();
      outline.geometry.dispose();
    }
    guide.geometry.dispose();
    for (const material of [...materials, ink, guideInk]) material.dispose();
  }
  return { group, draw, dispose };
}

function Paper({ sample }: { sample: Sample }) {
  const parent = useRef<Group>(null);
  const paper = useRef<ReturnType<typeof makePaper> | null>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    const host = parent.current;
    if (!host) return;
    const drawing = makePaper();
    host.add(drawing.group);
    paper.current = drawing;
    return () => {
      host.remove(drawing.group);
      drawing.dispose();
      paper.current = null;
    };
  }, []);
  useFrame(() => {
    const pose = sample(performance.now());
    paper.current?.draw(pose);
    if (pose.travel !== "rest") invalidate();
  });
  return <group ref={parent} />;
}

export function mountAirplane(
  host: HTMLDivElement,
  callbacks: StudioCallbacks & { sample: Sample },
) {
  return mountStudio(
    host,
    callbacks,
    { position: [2.4, -3.35, 4.0], minDistance: 3.9, maxDistance: 8 },
    <Paper sample={callbacks.sample} />,
  );
}
