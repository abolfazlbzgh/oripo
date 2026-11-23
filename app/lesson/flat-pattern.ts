import type { Point } from "../fold/geometry";
import { atIndex, type Face, type LessonPattern } from "./geometry";

type XY = readonly [number, number];
export type FlatFold = {
  id: string;
  line: readonly [XY, XY];
  sense: "front" | "back";
  packet?: string;
  durationMs: number;
  hingePly: number;
};

export const diamond: readonly XY[] = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];
type Corner = { material: XY; posed: XY };
type Panel = { corners: Corner[]; history: string[] };
// Only used to weld coincident intersections during authoring, in unit-diagonal coordinates.
const epsilon = 1e-10;
const materialKey = ([x, y]: XY) => `${Math.round(x / epsilon)},${Math.round(y / epsilon)}`;
const lerp = (a: XY, b: XY, t: number): XY => [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];

function splitPanel(corners: Corner[], distances: number[]) {
  const moving: Corner[] = [],
    fixed: Corner[] = [];
  for (const [i, a] of corners.entries()) {
    const j = (i + 1) % corners.length;
    const da = atIndex(distances, i),
      db = atIndex(distances, j);
    if (da >= -epsilon) moving.push(a);
    if (da <= epsilon) fixed.push(a);
    if ((da > epsilon && db < -epsilon) || (da < -epsilon && db > epsilon)) {
      const b = atIndex(corners, j),
        t = da / (da - db);
      const cut = { material: lerp(a.material, b.material, t), posed: lerp(a.posed, b.posed, t) };
      moving.push(cut);
      fixed.push(cut);
    }
  }
  return { moving, fixed };
}

// Subdivide once in material space. Each posed line selects the packet on its left.
// The runtime compiler still computes every spatial turn from its current material hinge.
export function flatPattern(
  lessonId: string,
  sheet: readonly XY[],
  folds: readonly FlatFold[],
): LessonPattern {
  let panels: Panel[] = [{ corners: sheet.map((p) => ({ material: p, posed: p })), history: [] }];
  const hinges = new Map<string, readonly [XY, XY]>();
  for (const {
    id,
    line: [a, b],
    packet,
    sense,
  } of folds) {
    if (sense !== "front" && sense !== "back") throw new Error(`Invalid fold sense in ${id}`);
    if (packet !== undefined && !hinges.has(packet))
      throw new Error(`Unknown earlier packet ${packet}`);
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length <= epsilon)
      throw new Error(`Invalid flat hinge in ${id}`);
    const nx = -dy / length,
      ny = dx / length;
    const side = ([x, y]: XY) => (x - a[0]) * nx + (y - a[1]) * ny;
    const along = ({ posed: [x, y] }: Corner) => x * dx + y * dy;
    const hinge: Corner[] = [];
    panels = panels.flatMap((panel) => {
      if (packet && !panel.history.includes(packet)) return [panel];
      const distances = panel.corners.map(({ posed }) => side(posed));
      if (!distances.some((d) => d > epsilon)) return [panel];
      const { moving, fixed } = splitPanel(panel.corners, distances);
      const result: Panel[] = [];
      if (fixed.length >= 3 && distances.some((d) => d < -epsilon))
        result.push({ corners: fixed, history: panel.history });
      hinge.push(...moving.filter(({ posed }) => Math.abs(side(posed)) <= epsilon));
      result.push({
        corners: moving.map(({ material, posed }) => {
          const d = side(posed);
          return { material, posed: [posed[0] - 2 * d * nx, posed[1] - 2 * d * ny] };
        }),
        history: [...panel.history, id],
      });
      return result;
    });
    hinge.sort((p, q) => along(p) - along(q));
    if (hinge.length < 2) throw new Error(`No moving hinge for ${id}`);
    hinges.set(id, [atIndex(hinge, 0).material, atIndex(hinge, hinge.length - 1).material]);
  }

  const points = new Map(
    panels.flatMap(({ corners }) =>
      corners.map(({ material }) => [materialKey(material), material] as const),
    ),
  );
  const ids = new Map([...points.keys()].map((key, i) => [key, `v-${i}`]));
  const vertex = (p: XY) => {
    const id = ids.get(materialKey(p));
    if (!id) throw new Error("Lost material hinge vertex");
    return id;
  };
  const vertices: Record<string, Point> = {};
  for (const p of points.values()) vertices[vertex(p)] = [...p, 0];

  // A later cut through only one ply can end in the middle of its neighbor's edge.
  // Insert that same material vertex into both boundaries before linking the faces.
  const faces: Face[] = panels.map(({ corners }, f) => ({
    id: `panel-${f}`,
    vertices: corners.flatMap(({ material: a }, i) => {
      const b = atIndex(corners, (i + 1) % corners.length).material;
      const dx = b[0] - a[0],
        dy = b[1] - a[1],
        length = Math.hypot(dx, dy);
      const along = (p: XY) => ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length;
      return [...points.values()]
        .filter(
          (p) =>
            Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) <= epsilon * length &&
            along(p) >= -epsilon &&
            along(p) < length - epsilon,
        )
        .sort((p, q) => along(p) - along(q))
        .map(vertex);
    }),
  }));
  const creases = Object.fromEntries(
    [...hinges].map(([id, [a, b]]) => [id, [vertex(a), vertex(b)] as const]),
  );
  const steps = folds.map(({ id, durationMs, sense }) => ({
    id,
    durationMs,
    turns: [
      {
        crease: id,
        degrees: sense === "front" ? 180 : -180,
        faces: faces.filter((_, i) => atIndex(panels, i).history.includes(id)).map((f) => f.id),
      },
    ],
  }));
  return { version: 1, lessonId, sheet: { vertices, faces, creases }, steps };
}
