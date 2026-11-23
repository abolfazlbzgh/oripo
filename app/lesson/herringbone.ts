import type { Point } from "../fold/geometry";
import { atIndex, compileLesson, type Face, type FoldStep } from "./geometry";

const pitch = 0.75,
  band = 0.5,
  stagger = 0.25;
const vertices: Record<string, Point> = {},
  faces: Face[] = [];
const creases: Record<string, readonly [string, string]> = {};
const verticals = ["west", "west-middle", "east-middle", "east"] as const;
const seams = ["near", "middle", "far"] as const;
const vertex = (r: number, c: number) => `grid-${r}-${c}`;
const panel = (r: number, c: number) => `band-${r}-panel-${c}`;
for (let row = 0; row <= 4; row++) {
  for (let col = 0; col <= 5; col++) {
    const x = col === 0 ? -1.5 : col === 5 ? 1.5 : -2 + pitch * col + (row % 2) * stagger;
    vertices[vertex(row, col)] = [x, -1 + row * band, 0];
    if (row < 4 && col < 5)
      faces.push({
        id: panel(row, col),
        vertices: [
          vertex(row, col),
          vertex(row, col + 1),
          vertex(row + 1, col + 1),
          vertex(row + 1, col),
        ],
      });
  }
  if (row > 0 && row < 4) creases[atIndex(seams, row - 1)] = [vertex(row, 0), vertex(row, 5)];
}
const chevrons: string[] = [];
for (const [i, name] of verticals.entries())
  for (let row = 0; row < 4; row++) {
    const guide = name + "-band-" + row;
    creases[guide] = [vertex(row, i + 1), vertex(row + 1, i + 1)];
    chevrons.push(guide);
  }
function turn(
  id: string,
  crease: string,
  degrees: number,
  select: (r: number, c: number) => boolean,
): FoldStep {
  const moving: string[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) if (select(r, c)) moving.push(panel(r, c));
  return { id, durationMs: 1400, turns: [{ crease, degrees, faces: moving }] };
}
function accordion(r: number, open: boolean) {
  const seam = atIndex(seams, r - 1);
  return turn(
    (open ? "release-" : "stack-") + seam,
    seam,
    (r % 2 ? 180 : -180) * (open ? -1 : 1),
    (row) => row >= r,
  );
}
function mark(i: number, open: boolean) {
  const name = atIndex(verticals, i),
    left = i < 2;
  return turn(
    (open ? "unmark-" : "mark-") + name,
    name + "-band-0",
    (i % 2 ? -1 : 1) * (left ? 180 : -180) * (open ? -1 : 1),
    (_, col) => (left ? col <= i : col > i),
  );
}
export const mapSteps: FoldStep[] = [
  accordion(3, false),
  accordion(2, false),
  accordion(1, false),
  ...verticals.flatMap((_, i) => [mark(i, false), mark(i, true)]),
  accordion(1, true),
  accordion(2, true),
  accordion(3, true),
  {
    id: "gather-ridges",
    durationMs: 2600,
    turns: [],
    guides: chevrons,
    field: {
      kind: "herringbone",
      origin: [-2, -1],
      pitch,
      band,
      stagger,
      degrees: (Math.acos(0.6) * 180) / Math.PI,
    },
  },
];
export const herringbone = compileLesson({
  version: 3,
  lessonId: "herringbone-map",
  sheet: { vertices, faces, creases },
  steps: mapSteps,
});
export const mapHingePlies: Record<string, number> = {};
for (const s of mapSteps) {
  const name = s.turns[0]?.crease;
  if (name)
    mapHingePlies[s.id] =
      name === "far"
        ? 0.5
        : name === "middle"
          ? -0.5
          : name === "near"
            ? 0.5
            : s.id.endsWith("west") || s.id.endsWith("east-middle")
              ? 3.5
              : -0.5;
}
export const mapEye: Point = [1.6, -3.5, 3.9];
