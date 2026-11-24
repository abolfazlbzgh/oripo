import type { Point } from "../fold/geometry";
import { creasedStock, pinAt } from "./creased-stock";
import { atIndex, compileLesson, type FoldStep } from "./geometry";
import type { XY } from "./flat-pattern";
import type { Crimp } from "./spatial-crimp";

const stock = creasedStock([
  [2, 0],
  [0, 2],
  [-2, 0],
  [0, -2],
]);
const bases = ["east", "north", "west", "south"].map((name, index) => {
  const orient = ([x, y]: XY): XY =>
    atIndex<XY>(
      [
        [x, y],
        [-y, x],
        [-x, -y],
        [y, -x],
      ],
      index,
    );
  const base = name + "-blintz",
    tip = name + "-inner-petal";
  stock.cut(base, [orient([1, 1]), orient([1, -1])], undefined, true);
  return { base, tip, orient };
});
for (const { base, tip, orient } of bases)
  stock.cut(tip, [orient([0.46, -0.46]), orient([0.46, 0.46])], (p) => p.includes(base));
const scale = Math.hypot(1, 0.28);
const petals = ["northeast", "northwest", "southwest", "southeast"].map((name, index) => {
  function orient([x, y]: XY): XY {
    return atIndex<XY>(
      [
        [x, y],
        [-y, x],
        [-x, -y],
        [y, -x],
      ],
      index,
    );
  }
  const local = (u: number, v: number): XY =>
    orient([1 + (u - 0.28 * v) / scale, (0.28 * u + v) / scale]);
  const root = name + "-root",
    hem = name + "-hem",
    rib = name + "-rib";
  stock.cut(root, [orient([0, 1]), orient([1, 0])]);
  const petal = (p: readonly string[]) => p.includes(root);
  stock.cut(hem, [orient([0.78, 1]), orient([1, 0.78])], petal, true);
  stock.cut(rib, [local(0, 0), local(0, 1)], petal);
  const guides: string[] = [];
  for (const [i, v] of [0.6, 0.77].entries())
    for (const s of [-1, 1]) {
      const crease = name + (i === 0 ? "-throat" : "-lip") + (s < 0 ? "-broad" : "-narrow");
      stock.cut(
        crease,
        [local(0, v), local(s, v + 1.25)],
        (p) => petal(p) && p.includes(rib) === s < 0,
      );
      guides.push(crease);
    }
  return { name, root, hem, local, orient, guides };
});
const sheet = stock.sheet();
const packets: Crimp[] = petals.map(({ root, local, orient, name, guides }) => {
  const pins = [local(0, 0), local(0, 0.6), local(0, 0.77), orient([0.72, 1])].map((p) =>
    pinAt(sheet, p),
  );
  for (let i = 0; i < 3; i++) {
    const id = name + "-midrib-" + i;
    sheet.creases[id] = [atIndex(pins, i), atIndex(pins, i + 1)];
    guides.push(id);
  }
  return {
    frame: [atIndex(pins, 0), atIndex(pins, 1), pinAt(sheet, orient([0, 1]))],
    side: -1,
    stations: [
      [0.6, 1.25],
      [0.77, 1.25],
    ],
    halfAngle: 52,
    hold: "left",
    faces: stock.ids(root),
  };
});
function raise(id: string, indices: readonly number[]): FoldStep {
  return {
    id,
    durationMs: 1800,
    turns: indices.map((i) => {
      const crease = atIndex(petals, i).root;
      return { crease, degrees: 49, faces: stock.ids(crease) };
    }),
  };
}
function crimpPair(id: string, indices: readonly number[]): FoldStep {
  return {
    id,
    durationMs: 2900,
    turns: [],
    crimps: indices.map((i) => atIndex(packets, i)),
    guides: indices.flatMap((i) => atIndex(petals, i).guides),
  };
}
export const calyxSteps: FoldStep[] = [
  {
    id: "blintz-base",
    durationMs: 2100,
    turns: bases.map(({ base }) => ({ crease: base, degrees: 180, faces: stock.ids(base) })),
  },
  {
    id: "hem-tips",
    durationMs: 1700,
    turns: petals.map(({ hem }) => ({ crease: hem, degrees: 180, faces: stock.ids(hem) })),
  },
  raise("raise-first", [0, 2]),
  raise("raise-second", [1, 3]),
  crimpPair("crimp-first", [0, 2]),
  crimpPair("crimp-second", [1, 3]),
  ...["lift-inner-sides", "lift-inner-ends"].map((id, j) => ({
    id,
    durationMs: 1650,
    turns: [j, j + 2].map((i) => {
      const crease = atIndex(bases, i).tip;
      return { crease, degrees: j === 0 ? 78 : 65, faces: stock.ids(crease) };
    }),
  })),
];
export const calyx = compileLesson({
  version: 4,
  lessonId: "pinwheel-calyx",
  sheet,
  steps: calyxSteps,
});
export const calyxHinges = {
  "blintz-base": 0.5,
  "hem-tips": 1.5,
  "raise-first": 0,
  "raise-second": 0,
  "lift-inner-sides": 1,
  "lift-inner-ends": 1,
};
export const calyxEye: Point = [2.4, -3.9, 3.9];
