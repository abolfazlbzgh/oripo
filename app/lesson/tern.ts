import type { Point } from "../fold/geometry";
import { creasedStock, pinAt } from "./creased-stock";
import { diamond } from "./flat-pattern";
import { atIndex, compileLesson, type FoldStep } from "./geometry";

const stock = creasedStock(diamond.map(([x, y]) => [1.5 * x, 1.5 * y]));
const baseSlope = Math.SQRT2 - 1;
stock.cut(
  "left-gate",
  [
    [-baseSlope, 0.5],
    [0, 1.5],
  ],
  undefined,
  true,
);
stock.cut(
  "right-gate",
  [
    [0, 1.5],
    [baseSlope, 0.5],
  ],
  undefined,
  true,
);
stock.cut(
  "bill-hem",
  [
    [-1, 1.35],
    [1, 1.35],
  ],
  undefined,
  true,
);
stock.cut("spine", [
  [0, 1],
  [0, -1],
]);
stock.cut("front-half", [
  [-1, 0],
  [1, 0],
]);
stock.cut(
  "left-cheek",
  [
    [-1, 0.55],
    [0, 1.35],
  ],
  (p) => !p.includes("spine"),
  true,
);
stock.cut(
  "right-cheek",
  [
    [0, 1.35],
    [1, 0.55],
  ],
  (p) => p.includes("spine"),
  true,
);
const marks = [
  ["throat", 0.4],
  ["crown", 0.76],
] as const;
for (const [name, y] of marks) {
  stock.cut(
    name + "-left",
    [
      [-1, y + 1.3],
      [0, y],
    ],
    (p) => !p.includes("spine"),
  );
  stock.cut(
    name + "-right",
    [
      [0, y],
      [1, y + 1.3],
    ],
    (p) => p.includes("spine"),
  );
}
stock.cut(
  "tail-left",
  [
    [0, -1.2],
    [-1, -1.56],
  ],
  (p) => !p.includes("spine"),
);
stock.cut(
  "tail-right",
  [
    [1, -1.56],
    [0, -1.2],
  ],
  (p) => p.includes("spine"),
);
stock.cut("left-wing", [
  [-0.28, -1],
  [-0.5, 1],
]);
stock.cut("right-wing", [
  [0.5, 1],
  [0.28, -1],
]);
stock.cut("left-wrist", [
  [-0.9, -1],
  [-0.5, 1],
]);
stock.cut("right-wrist", [
  [0.5, 1],
  [0.9, -1],
]);
const sheet = stock.sheet();
const pin = (x: number, y: number) => pinAt(sheet, [x, y]);
const neckGuides = marks.flatMap(([name]) => [name + "-left", name + "-right"]);
for (const [i, [a, b]] of (
  [
    [-1.5, -1.2],
    [-1.2, 0.4],
    [0.4, 0.76],
    [0.76, 1.35],
  ] as const
).entries())
  sheet.creases["keel-" + i] = [pin(0, a), pin(0, b)];
function mark(name: string, angle: number, release = false): FoldStep {
  const crease = name + "-left";
  return {
    id: (release ? "release-" : "mark-") + name,
    durationMs: 1400,
    turns: [
      { crease, degrees: angle, faces: [...stock.ids(crease), ...stock.ids(name + "-right")] },
    ],
  };
}
const front = stock.ids("front-half"),
  back = sheet.faces.filter((f) => !front.includes(f.id)).map((f) => f.id);
export const ternSteps: FoldStep[] = [
  {
    id: "kite-base",
    durationMs: 1850,
    turns: ["left-gate", "right-gate"].map((crease) => ({
      crease,
      degrees: 180,
      faces: stock.ids(crease),
    })),
  },
  stock.turn("double-bill", "bill-hem", 180),
  {
    id: "narrow-cheeks",
    durationMs: 1600,
    turns: ["left-cheek", "right-cheek"].map((crease) => ({
      crease,
      degrees: -180,
      faces: stock.ids(crease),
    })),
  },
  stock.turn("close-book", "spine", 180),
  mark("throat", 180),
  mark("throat", -180, true),
  mark("crown", -180),
  mark("crown", 180, true),
  mark("tail", 180),
  mark("tail", -180, true),
  stock.turn("open-book", "spine", -180),
  {
    id: "crimp-neck",
    durationMs: 3000,
    turns: [],
    guides: [...neckGuides, "keel-0", "keel-1", "keel-2", "keel-3", "tail-left", "tail-right"],
    crimps: [
      {
        frame: [pin(0, 0), pin(0, 0.4), pin(-0.39, 0)],
        side: -1,
        stations: [
          [0.4, 1.3],
          [0.76, 1.3],
        ],
        halfAngle: 63,
        hold: "spine",
        faces: front,
      },
      {
        frame: [pin(0, 0), pin(0, -1.2), pin(0.39, 0)],
        side: -1,
        stations: [[1.2, 0.36]],
        halfAngle: 63,
        hold: "spine",
        faces: back,
      },
    ],
  },
  stock.turn("spread-left", "left-wing", -70),
  stock.turn("spread-right", "right-wing", -70),
  {
    id: "bend-wrists",
    durationMs: 1700,
    turns: ["left-wrist", "right-wrist"].map((crease) => ({
      crease,
      degrees: 48,
      faces: stock.ids(crease),
    })),
  },
];
export const tern = compileLesson({ version: 4, lessonId: "river-tern", sheet, steps: ternSteps });
export const ternHinges: Record<string, number> = {
  "kite-base": 0.5,
  "double-bill": 1.5,
  "narrow-cheeks": -0.5,
  "close-book": 3.5,
  "open-book": 3.5,
  "spread-left": 0,
  "spread-right": 0,
  "bend-wrists": 0,
};
for (const step of ternSteps.slice(4, 10))
  ternHinges[step.id] = atIndex(step.turns, 0).crease === "crown-left" ? -4.5 : 11.5;
export const ternEye: Point = [3.1, 0.7, 2.6];
export const ternPalette = { front: "#4278ae", reverse: "#89b6d0", edge: "#294966" };
