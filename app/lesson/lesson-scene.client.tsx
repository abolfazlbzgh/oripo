import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import {
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  FrontSide,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from "three";
import { paperLayers, type HingePlies } from "./drawing";
import { instructionalPaper, type PaperPalette } from "./paper-palette";
import { mountStudio, type StudioCallbacks, type Viewpoint } from "../fold/studio.client";
import { atIndex, difference, poseAt, type CompiledLesson } from "./geometry";
import type { sampleLesson } from "./playback";

type Sample = (now: number) => ReturnType<typeof sampleLesson>;
export function createLessonMount(
  model: CompiledLesson,
  finished: PaperPalette,
  view: Viewpoint,
  heights: HingePlies,
) {
  const { faces, steps, creases } = model;

  const { offsets, foldOffsets, outlines } = paperLayers(model, heights);

  function geometryWithPositions(count: number) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(count * 3), 3));
    return geometry;
  }

  function makePaper() {
    const group = new Group();
    const materials: [MeshStandardMaterial, MeshStandardMaterial] = [
      new MeshStandardMaterial({
        color: instructionalPaper.front,
        side: FrontSide,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: 0,
        polygonOffsetUnits: 1,
      }),
      new MeshStandardMaterial({
        color: instructionalPaper.reverse,
        side: BackSide,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: 0,
        polygonOffsetUnits: 1,
      }),
    ];
    const ink = new LineBasicMaterial({
      color: instructionalPaper.edge,
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
    const guideSize = 2 * Math.max(...steps.map((s) => s.guides.length));
    const guide = new LineSegments(geometryWithPositions(guideSize), guideInk);
    guide.geometry.setAttribute(
      "lineDistance",
      new Float32BufferAttribute(new Float32Array(guideSize), 1),
    );
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
    function draw({ step, progress, position }: ReturnType<Sample>) {
      const guideStep = position === steps.length ? steps.length : step;
      if (position === lastPosition && guideStep === lastGuide) return;
      if ((position === steps.length) !== (lastPosition === steps.length)) {
        const palette = position === steps.length ? finished : instructionalPaper;
        materials[0].color.set(palette.front);
        materials[1].color.set(palette.reverse);
        ink.color.set(palette.edge);
      }
      lastPosition = position;
      lastGuide = guideStep;
      const pose = poseAt(model, step, progress);
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
        const names = atIndex(steps, guideStep).guides;
        const line = guide.geometry.getAttribute("position"),
          distances = guide.geometry.getAttribute("lineDistance");
        names.forEach((name, i) => {
          const ends = creases.get(name);
          if (!ends) throw new Error(`Missing guide for ${name}`);
          const a = atIndex(pose, ends[0]),
            b = atIndex(pose, ends[1]);
          line.setXYZ(2 * i, ...a);
          line.setXYZ(2 * i + 1, ...b);
          distances.setX(2 * i, 0);
          distances.setX(2 * i + 1, Math.hypot(...difference(a, b)));
        });
        guide.geometry.setDrawRange(0, 2 * names.length);
        line.needsUpdate = true;
        distances.needsUpdate = true;
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

  function Paper({ sample, active }: { sample: Sample; active: () => boolean }) {
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
      if (!active()) return;
      const pose = sample(performance.now());
      paper.current?.draw(pose);
      if (pose.travel !== "rest") invalidate();
    });
    return <group ref={parent} />;
  }

  return (
    host: HTMLDivElement,
    callbacks: StudioCallbacks & { sample: Sample; active: () => boolean },
  ) =>
    mountStudio(
      host,
      callbacks,
      view,
      <Paper sample={callbacks.sample} active={callbacks.active} />,
    );
}
