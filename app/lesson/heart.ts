import type { FlatFold } from "./flat-pattern";

export const heartFolds = [
  {
    id: "mark-center",
    line: [
      [0, 1],
      [0, -1],
    ],
    sense: "front",
    durationMs: 1400,
    hingePly: 0.5,
  },
  {
    id: "open-center",
    line: [
      [0, -1],
      [0, 1],
    ],
    packet: "mark-center",
    sense: "front",
    durationMs: 1400,
    hingePly: 0.5,
  },
  {
    id: "mark-across",
    line: [
      [-1, 0],
      [1, 0],
    ],
    sense: "front",
    durationMs: 1400,
    hingePly: 0.5,
  },
  {
    id: "open-across",
    line: [
      [1, 0],
      [-1, 0],
    ],
    packet: "mark-across",
    sense: "front",
    durationMs: 1400,
    hingePly: 0.5,
  },
  {
    id: "top-to-center",
    line: [
      [-0.5, 0.5],
      [0.5, 0.5],
    ],
    sense: "front",
    durationMs: 1400,
    hingePly: 0.5,
  },
  {
    id: "bottom-to-top",
    line: [
      [0.75, -0.25],
      [-0.75, -0.25],
    ],
    sense: "front",
    durationMs: 1600,
    hingePly: 1,
  },
  {
    id: "lift-left",
    line: [
      [0, -0.25],
      [-0.625, 0.375],
    ],
    sense: "front",
    durationMs: 1600,
    hingePly: 2.5,
  },
  {
    id: "lift-right",
    line: [
      [0.625, 0.375],
      [0, -0.25],
    ],
    sense: "front",
    durationMs: 1600,
    hingePly: 2.5,
  },
  {
    id: "soften-left",
    line: [
      [-0.55, 0],
      [-0.55, 1],
    ],
    sense: "back",
    durationMs: 1100,
    hingePly: -0.5,
  },
  {
    id: "soften-right",
    line: [
      [0.55, 1],
      [0.55, 0],
    ],
    sense: "back",
    durationMs: 1100,
    hingePly: -0.5,
  },
  {
    id: "left-lobe",
    line: [
      [-1, 0.65],
      [0, 0.65],
    ],
    packet: "lift-left",
    sense: "back",
    durationMs: 1100,
    hingePly: -0.5,
  },
  {
    id: "right-lobe",
    line: [
      [0, 0.65],
      [1, 0.65],
    ],
    packet: "lift-right",
    sense: "back",
    durationMs: 1100,
    hingePly: -0.5,
  },
] as const satisfies readonly FlatFold[];
export type HeartStepId = (typeof heartFolds)[number]["id"];
