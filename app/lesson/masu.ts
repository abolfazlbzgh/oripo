import type { Point } from "../fold/geometry";
import {
  atIndex,
  compileLesson,
  type Face,
  type FoldStep,
  type LessonPattern,
  type Turn,
} from "./geometry";

// A square with diagonal four. Bisecting each half-unit cell in both directions
// retains the material diagonals of the four gussets and their reflected plies.
const vertices: Record<string, Point> = {},
  faces: Face[] = [];
const centers = new Map<string, { x: number; y: number }>();
function vertex(x: number, y: number) {
  const id = `v-${Math.round(4 * x + 8)}-${Math.round(4 * y + 8)}`;
  vertices[id] = [x, y, 0];
  return id;
}
for (let col = -4; col < 4; col++)
  for (let row = -4; row < 4; row++) {
    const x = col / 2,
      y = row / 2;
    const rim = [
      [x, y],
      [x + 0.5, y],
      [x + 0.5, y + 0.5],
      [x, y + 0.5],
    ] as const;
    for (const [i, a] of rim.entries()) {
      const b = atIndex(rim, (i + 1) % 4);
      const cx = (a[0] + b[0] + x + 0.25) / 3,
        cy = (a[1] + b[1] + y + 0.25) / 3;
      if (Math.abs(cx) + Math.abs(cy) > 2) continue;
      const id = `panel-${faces.length}`;
      faces.push({ id, vertices: [vertex(...a), vertex(...b), vertex(x + 0.25, y + 0.25)] });
      centers.set(id, { x: cx, y: cy });
    }
  }
const creases: Record<string, readonly [string, string]> = {};
function crease(id: string, x: number, y: number, u: number, v: number) {
  creases[id] = [vertex(x, y), vertex(u, v)];
  return id;
}
const turn = (
  crease: string,
  degrees: number,
  select: (x: number, y: number) => boolean,
  corner?: Turn["corner"],
): Turn => ({
  crease,
  degrees,
  faces: [...centers].filter(([, p]) => select(p.x, p.y)).map(([id]) => id),
  corner,
});
const action = <Id extends string>(id: Id, ...turns: Turn[]) => ({ id, durationMs: 1800, turns });
const horizontal = crease("horizontal", -2, 0, 2, 0),
  vertical = crease("vertical", 0, -2, 0, 2);
const sides = [-1, 1] as const;
const sideName = (s: number) => (s < 0 ? "left" : "right");
const endName = (s: number) => (s < 0 ? "near" : "far");
const xBlintz = (x: number) => (Math.abs(x) > 1 ? Math.sign(x) * (2 - Math.abs(x)) : x);
const yBlintz = xBlintz;
function corner(s: number) {
  return turn(crease(sideName(s) + "-blintz", s, -1, s, 1), -s * 180, (x) => s * x > 1);
}
function endTips(open: boolean) {
  return sides.map((s) =>
    turn(
      crease(endName(s) + "-rim", -0.5, s, 0.5, s),
      s * (open ? -180 : 180),
      (_, y) => s * y > 1,
    ),
  );
}
function endGuides(open: boolean) {
  return sides.map((s) =>
    turn(
      crease(endName(s) + "-wall", -0.5, s * 0.5, 0.5, s * 0.5),
      s * (open ? -180 : 180),
      (_, y) => s * yBlintz(y) > 0.5,
    ),
  );
}
function sideWalls(degrees: number) {
  return sides.map((s) =>
    turn(
      crease(sideName(s) + "-wall", s * 0.5, -0.5, s * 0.5, 0.5),
      -s * degrees,
      (x) => s * xBlintz(x) > 0.5,
    ),
  );
}
function raiseEnd(s: number) {
  const name = endName(s) + "-wall";
  const turns = [turn(name, 90 * s, (x, y) => s * y > 0.5 && Math.abs(xBlintz(x)) < 0.5)];
  for (const side of sides) {
    const prefix = endName(s) + "-" + sideName(side);
    const inCorner = (x: number, y: number) => side * xBlintz(x) > 0.5 && s * y > 0.5;
    turns.push(
      turn(
        crease(prefix + "-post", side * 0.5, s * 0.5, side, s * 0.5),
        side * s * 90,
        (x, y) => inCorner(x, y) && side * xBlintz(x) > s * y,
        { motion: "right-gusset" },
      ),
    );
    turns.push(
      turn(
        crease(prefix + "-flap", side * 0.5, s * 0.5, side * 0.5, s),
        -side * s * 90,
        (x, y) => inCorner(x, y) && side * xBlintz(x) < s * y,
        { motion: "right-gusset", carriedBy: name },
      ),
    );
  }
  return turns;
}
function endGuides3D(s: number) {
  return [
    endName(s) + "-wall",
    ...sides.map((side) =>
      crease(endName(s) + "-" + sideName(side) + "-diagonal", side * 0.5, s * 0.5, side, s),
    ),
  ];
}
function bendTip(s: number) {
  return turn(
    crease(endName(s) + "-floor", -0.5, s * 1.5, 0.5, s * 1.5),
    -90 * s,
    (_, y) => s * y > 1.5,
  );
}
function wrap(s: number) {
  return turn(endName(s) + "-rim", 180 * s, (_, y) => s * y > 1);
}
export const masuSteps = [
  action(
    "mark-across",
    turn(horizontal, 180, (_, y) => y > 0),
  ),
  action(
    "open-across",
    turn(horizontal, -180, (_, y) => y > 0),
  ),
  action(
    "mark-center",
    turn(vertical, -180, (x) => x > 0),
  ),
  action(
    "open-center",
    turn(vertical, 180, (x) => x > 0),
  ),
  action("left-to-center", corner(-1)),
  action("right-to-center", corner(1)),
  action("end-tips", ...endTips(false)),
  action("mark-ends", ...endGuides(false)),
  action("open-end-marks", ...endGuides(true)),
  action("release-ends", ...endTips(true)),
  action("mark-sides", ...sideWalls(180)),
  action("stand-sides", ...sideWalls(-90)),
  { ...action("raise-far-end", ...raiseEnd(1)), guides: endGuides3D(1) },
  action("bend-far-tip", bendTip(1)),
  action("line-far-wall", wrap(1)),
  { ...action("raise-near-end", ...raiseEnd(-1)), guides: endGuides3D(-1) },
  action("bend-near-tip", bendTip(-1)),
  action("line-near-wall", wrap(-1)),
] as const satisfies readonly FoldStep[];
export const masuPattern = {
  version: 2,
  lessonId: "masu-box",
  sheet: { vertices, faces, creases },
  steps: masuSteps,
} satisfies LessonPattern;
export const masu = compileLesson(masuPattern);

function cornerPivots(s: number) {
  const end = endName(s);
  const pivots: Record<string, Point> = { [end + "-wall"]: [0, 0, 0] };
  for (const side of sides) {
    pivots[end + "-" + sideName(side) + "-post"] = [4 * side, 0, 0];
    pivots[end + "-" + sideName(side) + "-flap"] = [0, 0, 3];
  }
  return pivots;
}
export const masuHingePlies = {
  "mark-across": 0.5,
  "open-across": 0.5,
  "mark-center": 0.5,
  "open-center": 0.5,
  "left-to-center": 0.5,
  "right-to-center": 0.5,
  "end-tips": 0.5,
  "mark-ends": 1.5,
  "open-end-marks": 1.5,
  "release-ends": 0.5,
  "mark-sides": 1.5,
  "stand-sides": 1.5,
  "raise-far-end": cornerPivots(1),
  "bend-far-tip": 0,
  "line-far-wall": [0, -4, 3],
  "raise-near-end": cornerPivots(-1),
  "bend-near-tip": 0,
  "line-near-wall": [0, 4, 3],
} as const;
