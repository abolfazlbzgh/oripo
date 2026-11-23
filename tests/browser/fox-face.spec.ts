import { foxFolds } from "../../app/lesson/fox";
import { foxSheet, foxText } from "../../app/lesson/fox.en";
import { flatJourney } from "./flat-journey";

// The left ear sweeps a circle of radius 1/√13 about the chin-to-cheek hinge.
flatJourney({
  slug: "fox-face",
  title: "Fox face",
  steps: foxFolds,
  sheet: foxSheet,
  copy: foxText,
  middles: {
    1: [
      [
        [-1, 0, 0],
        [0, -1, 0],
        [1, 0, 0],
      ],
      [
        [-1, 0, 0],
        [1, 0, 0],
        [0, 0, 1],
      ],
    ],
    5: [
      [
        [0, -1, 0],
        [1, 0, 0],
        [-2 / 3, 0, 0],
      ],
      [
        [0, -1, 0],
        [-2 / 3, 0, 0],
        [-10 / 13, 2 / 13, -1 / Math.sqrt(13)],
      ],
    ],
  },
  outline: [
    [0, -1, 0],
    [2 / 3, 0, 0],
    [7 / 13, 4 / 13, 0],
    [7 / 17, 0, 0],
    [-7 / 17, 0, 0],
    [-7 / 13, 4 / 13, 0],
    [-2 / 3, 0, 0],
  ],
  probes: [
    [0.045, -0.6, 0],
    [-0.03, -0.84, 0],
    [0.15, -0.13, 0],
    [0.53, 0.16, 0],
  ],
  colors: ["green", "green", "gold", "gold"],
});
