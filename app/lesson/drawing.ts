import type { Point } from "../fold/geometry";
import {
  atIndex,
  rotate,
  packetAngle,
  turnAngle,
  type CompiledLesson,
  type Pose,
} from "./geometry";

type PlyOrigin = number | Point;
export type HingePlies = Readonly<Record<string, PlyOrigin | Readonly<Record<string, PlyOrigin>>>>;
export function paperLayers(model: CompiledLesson, heights: HingePlies) {
  const { faces, steps } = model;
  // Rotate the existing drawing stack about a virtual hinge. The material pose stays exact.
  function foldOffsets(start: Pose, step: number, progress: number): Pose {
    const result = [...start];
    const action = atIndex(steps, step);
    function pivot(crease: string): Point {
      const setting = heights[action.id];
      const height =
        typeof setting === "number" || Array.isArray(setting)
          ? setting
          : (setting as Record<string, PlyOrigin> | undefined)?.[crease];
      if (height === undefined)
        throw new Error(`Missing drawing height for ${action.id}/${crease}`);
      const [x, y, z] = typeof height === "number" ? [0, 0, height] : height;
      if (![x, y, z].every(Number.isFinite))
        throw new Error(`Invalid drawing height in ${action.id}`);
      return [x * 0.0007, y * 0.0007, z * 0.0007];
    }
    for (const turn of action.turns) {
      const origin = pivot(turn.crease),
        angle = packetAngle(turn, progress);
      const carrier = turn.corner?.carrier;
      const carried = carrier && {
        origin: pivot(carrier.crease),
        angle: turnAngle(carrier.degrees, progress),
      };
      for (const f of turn.faces) {
        const local = rotate(atIndex(start, f), origin, turn.axis, angle);
        result[f] =
          carrier && carried ? rotate(local, carried.origin, carrier.axis, carried.angle) : local;
      }
    }
    return result;
  }
  const offsets: Pose[] = [faces.map(() => [0, 0, 0])];
  for (let i = 0; i < steps.length; i++) offsets.push(foldOffsets(atIndex(offsets, i), i, 1));

  const outlines = faces.map(() => [] as { a: number; b: number; appearsAfter: number }[]);
  for (const edge of model.edges) {
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

  return { offsets, foldOffsets, outlines };
}
