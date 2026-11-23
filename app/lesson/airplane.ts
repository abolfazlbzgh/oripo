import type { Point } from "../fold/geometry";
import { compileLesson, type Face, type FoldStep, type LessonPattern, type Turn } from "./geometry";

export const airplaneId = "paper-airplane";
type Side = "left" | "right";
const halfLength = 1.5;
const taper = Math.PI / 8;
const wing = Math.atan(0.1);
// Rays in the original paper include the reflections of the later wing hinge in each ply.
const rays = [
  0,
  wing,
  taper,
  2 * taper - wing,
  2 * taper,
  2 * taper + wing,
  3 * taper,
  4 * taper - wing,
  Math.PI / 2,
];
const vertices: Record<string, Point> = { nose: [0, halfLength, 0], tail: [0, -halfLength, 0] };
const faces: Face[] = [];
const creases: Record<string, readonly [string, string]> = { spine: ["nose", "tail"] };

for (const side of ["left", "right"] as const) {
  const sign = side === "left" ? -1 : 1;
  let previous = "tail";
  for (const [i, ray] of rays.entries()) {
    if (i === 0) continue;
    const towardTail = Math.min(3, 1 / Math.tan(ray));
    const towardSide = Math.min(1, 3 * Math.tan(ray));
    const end = `${side}-ray-${i}`;
    vertices[end] = [
      sign * towardSide,
      ray === Math.PI / 2 ? halfLength : halfLength - towardTail,
      0,
    ];
    const rim = [previous];
    // The second sector reaches the original rear corner before the next ray meets the side.
    if (i === 2) {
      const corner = `${side}-rear`;
      vertices[corner] = [sign, -halfLength, 0];
      rim.push(corner);
    }
    rim.push(end);
    faces.push({
      id: `${side}-${i - 1}`,
      vertices: ["nose", ...(side === "left" ? rim.reverse() : rim)],
    });
    previous = end;
  }
  creases[`${side}-corner`] = ["nose", `${side}-ray-4`];
  creases[`${side}-taper`] = ["nose", `${side}-ray-2`];
  creases[`${side}-wing`] = ["nose", `${side}-ray-1`];
}

const half = [0, 1, 2, 3, 4, 5, 6, 7];
// Indices always name material bands in the unfolded sheet, even when four bands overlap.
const corner = [4, 5, 6, 7];
const nosePacket = [2, 3, 4, 5];
const wingPacket = [1, 2, 5, 6];
const turn = (side: Side, crease: string, bands: number[], degrees: number): Turn => ({
  crease,
  degrees,
  faces: bands.map((i) => `${side}-${i}`),
});
const action = <Id extends string>(id: Id, durationMs: number, ...turns: Turn[]) => ({
  id,
  durationMs,
  turns,
});
const steps = [
  action("mark-spine", 1600, turn("right", "spine", half, 180)),
  action("open-sheet", 1600, turn("right", "spine", half, -180)),
  action("left-corner", 1500, turn("left", "left-corner", corner, -180)),
  action("right-corner", 1500, turn("right", "right-corner", corner, 180)),
  action("left-taper", 1800, turn("left", "left-taper", nosePacket, -180)),
  action("right-taper", 1800, turn("right", "right-taper", nosePacket, 180)),
  action("close-body", 1800, turn("left", "spine", half, -90), turn("right", "spine", half, 90)),
  action("left-wing", 1500, turn("left", "left-wing", wingPacket, 84)),
  action("right-wing", 1500, turn("right", "right-wing", wingPacket, -84)),
] as const satisfies readonly FoldStep[];

export type AirplaneStepId = (typeof steps)[number]["id"];
export const airplanePattern = {
  version: 1,
  lessonId: airplaneId,
  sheet: { vertices, faces, creases },
  steps,
} satisfies LessonPattern;
export const airplane = compileLesson(airplanePattern);
