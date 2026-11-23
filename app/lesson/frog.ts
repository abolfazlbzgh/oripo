import { atIndex, compileLesson, type FoldStep, type Turn } from "./geometry";
import { splitPanel, weldPanels, type Corner, type XY } from "./flat-pattern";
import type { RigidField } from "./rigid-field";
import type { HingePlies } from "./drawing";
import type { Point } from "../fold/geometry";

type Side = -1 | 1;
const sides = [-1, 1] as const;
const name = (s: Side) => (s < 0 ? "left" : "right");
const side = (x: number): Side => (x < 0 ? -1 : 1);
type Position = (p: XY) => XY;
const original: Position = (p) => p;
const strip: Position = ([x, y]) => [side(x) * Math.min(Math.abs(x), 1 - Math.abs(x)), y];
const head: Position = (p) => {
  const [x, y] = strip(p),
    h = y - 0.5;
  if (h <= -Math.abs(x)) return [x, y];
  if (h >= Math.abs(x)) return [x, 1 - y];
  return [side(x) * Math.abs(h), 0.5 - Math.abs(x)];
};
const loose = (p: XY) => p[1] > 0.5;
const raisedFoot = (p: XY) => {
  const [x, y] = head(p);
  return loose(p) && y < Math.abs(x);
};
const lift: Position = (p) => {
  const [x, y] = head(p);
  return raisedFoot(p) ? [side(x) * y, Math.abs(x)] : [x, y];
};
const foot: Position = (p) => {
  const [x, y] = lift(p),
    s = side(strip(p)[0]),
    u = s * x;
  return raisedFoot(p) && y > 3 * u ? [s * (-0.8 * u + 0.6 * y), 0.6 * u + 0.8 * y] : [x, y];
};
const tailY = (y: number) => (y < -0.5 ? -1 - y : y);
const doubleTail: Position = (p) => {
  const [x, y] = foot(p);
  return [x, tailY(y)];
};
const waist: Position = (p) => {
  const [x, y] = doubleTail(p),
    u = Math.abs(x);
  return !loose(p) && u > 0.25 ? [side(x) * (0.5 - u), y] : [x, y];
};
const foldedTail: Position = (p) => {
  const [x, y] = waist(p);
  return [x, y < -0.25 ? -0.5 - y : y];
};
function pocket(p: XY) {
  const [x, y] = strip(p),
    v = tailY(y) + 0.25,
    u = Math.abs(x) - 0.25;
  if (y >= 0 || u <= 0) return;
  if (v < 0) return u > -v ? "gusset" : "cover";
  if (u > v) return "lip";
}
const spread: Position = (p) => {
  const sector = pocket(p),
    [x, y] = foldedTail(p);
  if (!sector) return [x, y];
  const s = side(strip(p)[0]),
    u = 0.25 - s * x,
    v = y + 0.25;
  if (sector === "cover") return [s * (0.25 + u), y];
  return [s * (0.25 + (sector === "lip" ? -v : v)), -0.25 + u];
};
const rearPacket = (p: XY) => p[1] < 0 && (tailY(p[1]) < -0.25 || !!pocket(p));
const hindFoot: Position = (p) => {
  const [x, y] = spread(p),
    s = side(x),
    u = s * x;
  return rearPacket(p) && y > -u / 2 ? [s * (0.6 * u - 0.8 * y), -0.8 * u - 0.6 * y] : [x, y];
};

// Subdivide in original fiber coordinates. A later crease is cut only in the
// plies that actually carry it. Welding inserts T-junctions in both neighbors.
const square: XY[] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
let panels: Corner[][] = [square.map((p) => ({ material: p, posed: p }))];
const middle = (poly: Corner[]): XY => [
  poly.reduce((v, c) => v + c.material[0], 0) / poly.length,
  poly.reduce((v, c) => v + c.material[1], 0) / poly.length,
];
type Select = (p: XY) => boolean;
const all: Select = () => true;
function cut(distance: (p: XY) => number, select: Select = all) {
  panels = panels.flatMap((poly) => {
    if (!select(middle(poly))) return [poly];
    const ds = poly.map((c) => distance(c.material));
    if (!ds.some((d) => d > 1e-10) || !ds.some((d) => d < -1e-10)) return [poly];
    const { moving, fixed } = splitPanel(poly, ds);
    return [fixed, moving];
  });
}
for (const x of [-0.5, 0, 0.5]) cut((p) => p[0] - x);
for (const y of [-0.75, -0.5, -0.25, 0, 0.5]) cut((p) => p[1] - y);
for (const s of sides)
  cut(
    (p) => p[1] - 0.5 - s * strip(p)[0],
    (p) => p[1] > 0,
  );
for (const s of sides)
  cut(
    (p) => head(p)[1] - s * head(p)[0],
    (p) => loose(p) && s * strip(p)[0] > 0,
  );
for (const s of sides)
  cut(
    (p) => lift(p)[1] - 3 * s * lift(p)[0],
    (p) => raisedFoot(p) && s * strip(p)[0] > 0,
  );
for (const s of sides)
  cut(
    (p) => s * head(p)[0] - 0.25,
    (p) => !loose(p),
  );
cut(
  (p) => Math.abs(tailY(p[1]) + 0.25) - Math.abs(Math.abs(strip(p)[0]) - 0.25),
  (p) => p[1] < 0,
);
for (const s of sides)
  cut(
    (p) => spread(p)[1] + (s * spread(p)[0]) / 2,
    (p) => rearPacket(p) && s * strip(p)[0] > 0,
  );
cut(
  (p) => hindFoot(p)[1] + 0.125,
  (p) => p[1] < 0,
);
const centers = panels.map(middle);
const entries = (select: Select) => centers.flatMap((p, i) => (select(p) ? ["panel-" + i] : []));
const hinges = new Map<string, readonly [XY, XY]>();
function axis(id: string, coords: Position, a: XY, b: XY, select: Select): string {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const points = panels
    .flatMap((f, i) => (select(atIndex(centers, i)) ? f : []))
    .map((c) => ({ m: c.material, p: coords(c.material) }))
    .filter(({ p }) => Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) < 1e-8)
    .sort((v, w) => (v.p[0] - w.p[0]) * dx + (v.p[1] - w.p[1]) * dy);
  if (points.length < 2) throw Error("Missing frog hinge " + id);
  hinges.set(id, [atIndex(points, 0).m, atIndex(points, points.length - 1).m]);
  return id;
}
function turn(id: string, coords: Position, a: XY, b: XY, degrees: number, select: Select): Turn {
  return { crease: axis(id, coords, a, b, select), degrees, faces: entries(select) };
}
const act = (id: string, ...turns: Turn[]): FoldStep => ({ id, durationMs: 1600, turns });
const horizontal = (id: string, coords: Position, y: number, degrees: number, select: Select) =>
  turn(id, coords, [-1, y], [1, y], degrees, select);
const mark = (s: Side, open: boolean) =>
  turn(
    name(s) + "-diagonal",
    strip,
    [0, 0.5],
    [1, 0.5 + s],
    open ? -180 : 180,
    (p) => p[1] > 0.5 + s * strip(p)[0],
  );
const headSquare: RigidField = { kind: "waterbomb", center: [0, 0.5], radius: 0.5, plies: 2 };
const headGuides = sides.flatMap((s) =>
  (
    [
      ["lower", 0],
      ["side", 0.5],
      ["upper", 1],
    ] as const
  ).map(([edge, y]) => {
    const id = name(s) + "-head-" + edge;
    hinges.set(id, [
      [0, 0.5],
      [s * 0.5, y],
    ]);
    return id;
  }),
);
const crossMark = (open: boolean) =>
  horizontal("head-cross", strip, 0.5, open ? 180 : -180, (p) => p[1] > 0.5);
const belly = (p: XY) => p[1] < 0;
const lower = (p: XY) => belly(p) && tailY(p[1]) < -0.25;
const regions: NonNullable<FoldStep["regions"]> = sides.flatMap((s) =>
  (["lip", "gusset", "cover"] as const).map((sector) => ({
    field: {
      kind: "pocket-squash" as const,
      center: [s * 0.25, -0.25] as XY,
      inward: side(-s),
      sector,
      // Seat the overturned lip in plies 8–11; the external foot has the
      // gusset's four plies above the cover's four plies.
      landingPly: { lip: 15, gusset: -4, cover: 11 }[sector],
    },
    faces: entries((p) => s * strip(p)[0] > 0 && pocket(p) === sector),
  })),
);
function pocketMarks(open: boolean) {
  return sides.map((s) =>
    turn(
      name(s) + "-pocket-diagonal",
      foldedTail,
      [s * 0.25, -0.25],
      [0, 0],
      s * (open ? 180 : -180),
      (p) => {
        const [x, y] = foldedTail(p);
        return lower(p) && s * x > 0 && y > -s * x;
      },
    ),
  );
}
const spring = horizontal("spring-base", hindFoot, 0, -180, belly);
// At full closure the distal leg has positive Y. Its material hinge stays
// the same across the return bend and the final slight release at the waist.
const compressed: Position = (p) => {
  const [x, y] = hindFoot(p);
  return [x, belly(p) ? -y : y];
};
export const frogSteps: FoldStep[] = [
  act(
    "double-the-square",
    ...sides.map((s) =>
      turn(
        name(s) + "-gate",
        original,
        [s * 0.5, -1],
        [s * 0.5, 1],
        -s * 180,
        (p) => s * p[0] > 0.5,
      ),
    ),
  ),
  act("mark-first-diagonal", mark(1, false)),
  act("open-first-diagonal", mark(1, true)),
  act("mark-second-diagonal", mark(-1, false)),
  act("open-second-diagonal", mark(-1, true)),
  act("mark-head-cross", crossMark(false)),
  act("open-head-cross", crossMark(true)),
  {
    id: "collapse-head",
    durationMs: 2400,
    turns: [],
    guides: headGuides,
    field: headSquare,
  },
  act(
    "raise-front-feet",
    ...sides.map((s) =>
      turn(
        name(s) + "-foreleg",
        head,
        [0, 0],
        [s, 1],
        -s * 180,
        (p) => raisedFoot(p) && s * strip(p)[0] > 0,
      ),
    ),
  ),
  act(
    "splay-front-feet",
    ...sides.map((s) =>
      turn(
        name(s) + "-toe",
        lift,
        [0, 0],
        [s, 3],
        s * 180,
        (p) => raisedFoot(p) && s * strip(p)[0] > 0 && lift(p)[1] > 3 * s * lift(p)[0],
      ),
    ),
  ),
  act(
    "double-the-tail",
    horizontal("tail-half", foot, -0.5, -180, (p) => p[1] < -0.5),
  ),
  act(
    "narrow-waist",
    ...sides.map((s) =>
      turn(
        name(s) + "-waist",
        doubleTail,
        [s * 0.25, -1],
        [s * 0.25, 1],
        -s * 180,
        (p) => !loose(p) && s * head(p)[0] > 0.25,
      ),
    ),
  ),
  act("roll-rear-edge", horizontal("rear-roll", waist, -0.25, -180, lower)),
  act("mark-pockets", ...pocketMarks(false)),
  act("open-pocket-marks", ...pocketMarks(true)),
  {
    id: "spread-hind-pockets",
    durationMs: 2500,
    turns: [],
    guides: ["left-pocket-diagonal", "right-pocket-diagonal"],
    regions,
  },
  act(
    "angle-hind-feet",
    ...sides.map((s) =>
      turn(
        name(s) + "-heel",
        spread,
        [0, 0],
        [s, -0.5],
        s * 180,
        (p) => rearPacket(p) && s * spread(p)[0] > 0 && spread(p)[1] > (-s * spread(p)[0]) / 2,
      ),
    ),
  ),
  act("double-the-spring", spring),
  act(
    "return-the-pleat",
    horizontal("spring-return", compressed, 0.125, 150, (p) => belly(p) && hindFoot(p)[1] < -0.125),
  ),
  act("ease-the-spring", { ...spring, degrees: 18 }),
];
const sheet = weldPanels(
  panels.map((corners) => ({ corners })),
  hinges,
);
export const frogPattern = {
  version: 3 as const,
  lessonId: "jumping-frog",
  sheet,
  steps: frogSteps,
};
export const frog = compileLesson(frogPattern);
export const frogHingePlies: HingePlies = {
  "double-the-square": 0.5,
  "mark-first-diagonal": 1.5,
  "open-first-diagonal": 1.5,
  "mark-second-diagonal": 1.5,
  "open-second-diagonal": 1.5,
  "mark-head-cross": -0.5,
  "open-head-cross": -0.5,
  "raise-front-feet": 7.5,
  "splay-front-feet": 11.5,
  "double-the-tail": 1.5,
  "narrow-waist": 3.5,
  "roll-rear-edge": 7.5,
  "mark-pockets": 15.5,
  "open-pocket-marks": 15.5,
  "angle-hind-feet": 15.5,
  "double-the-spring": 23.5,
  "return-the-pleat": 47.5,
  "ease-the-spring": 23.5,
};
export const frogEye: Point = [0.55, -1.15, 2.75];
export const frogPlyThickness = 0.0002;
