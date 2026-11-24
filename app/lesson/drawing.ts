import type { Point } from "../fold/geometry";
import { chartPoint } from "./rigid-field";
import {
  atIndex,
  packetTransform,
  type PreparedTurn,
  type CompiledLesson,
  type Pose,
} from "./geometry";

type PlyOrigin = number | Point;
export type HingePlies = Readonly<Record<string, PlyOrigin | Readonly<Record<string, PlyOrigin>>>>;
export function paperLayers(model: CompiledLesson, heights: HingePlies, plyThickness = 0.0007) {
  if (!Number.isFinite(plyThickness) || plyThickness <= 0)
    throw Error("Invalid drawing ply thickness");
  const { faces, steps } = model;
  // Rotate the existing drawing stack about a virtual hinge. The material pose stays exact.
  function foldOffsets(start: Pose, step: number, progress: number): Pose {
    const result = [...start];
    const action = atIndex(steps, step);
    if (action.reopenTo !== undefined)
      return foldOffsets(
        atIndex(offsets, step - 1),
        step - 1,
        1 - (1 - action.reopenTo) * progress,
      );
    if (action.charts)
      return action.charts.map((chart, i) => {
        const transform = chart(progress);
        const [x, y, z] = chartPoint(transform, atIndex(start, i), true);
        const rise = plyThickness * transform.ply * progress;
        const normal = transform.plyNormal;
        return normal
          ? ([x + normal[0] * rise, y + normal[1] * rise, z + normal[2] * rise] as Point)
          : ([x, y, z + rise] as Point);
      });
    function pivot({ crease }: PreparedTurn): Point {
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
      return [x * plyThickness, y * plyThickness, z * plyThickness];
    }
    for (const turn of action.turns) {
      const apply = packetTransform(turn, progress, pivot);
      for (const f of turn.faces) result[f] = apply(atIndex(start, f));
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
        ({ turns, charts }) =>
          (charts &&
            [0.5, 1].some((p) => {
              const a = atIndex(charts, first)(p),
                b = atIndex(charts, second)(p);
              return a.x.some(
                (v, i) =>
                  Math.abs(v - atIndex(b.x, i)) > 1e-8 ||
                  Math.abs(atIndex(a.y, i) - atIndex(b.y, i)) > 1e-8,
              );
            })) ||
          turns.findIndex((t) => t.faces.includes(first)) !==
            turns.findIndex((t) => t.faces.includes(second)),
      );
      appearsAfter = action < 0 ? Infinity : action;
    }
    for (const f of edge.faces) atIndex(outlines, f).push({ a: edge.a, b: edge.b, appearsAfter });
  }

  return { offsets, foldOffsets, outlines };
}
