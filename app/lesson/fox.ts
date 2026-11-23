import type { FlatFold } from "./flat-pattern";

export const foxFolds = [
  {
    id: "fold-triangle",
    line: [
      [-1, 0],
      [1, 0],
    ],
    sense: "front",
    durationMs: 1500,
    hingePly: 0.5,
  },
  {
    id: "mark-forehead",
    line: [
      [0, 0],
      [0, -1],
    ],
    sense: "front",
    durationMs: 1400,
    hingePly: 1.5,
  },
  {
    id: "open-forehead",
    line: [
      [0, -1],
      [0, 0],
    ],
    packet: "mark-forehead",
    sense: "front",
    durationMs: 1400,
    hingePly: 1.5,
  },
  {
    id: "lift-muzzle",
    line: [
      [0.3, -0.7],
      [-0.3, -0.7],
    ],
    packet: "fold-triangle",
    sense: "front",
    durationMs: 1300,
    hingePly: 1.5,
  },
  {
    id: "left-ear",
    line: [
      [0, -1],
      [-2 / 3, 0],
    ],
    sense: "back",
    durationMs: 1600,
    hingePly: -0.5,
  },
  {
    id: "right-ear",
    line: [
      [2 / 3, 0],
      [0, -1],
    ],
    sense: "back",
    durationMs: 1600,
    hingePly: -0.5,
  },
] as const satisfies readonly FlatFold[];
export type FoxStepId = (typeof foxFolds)[number]["id"];
