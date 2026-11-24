import { fixture } from "../model-fixture";
import { foxOutline } from "./finished-outlines";
import foxManuscript from "../../app/i18n/en/fox-face.json" with { type: "json" };
import { flatJourney } from "./flat-journey";

const foxFolds = fixture("fox-face").pattern.steps;
const { sheet: foxSheet, steps: foxText } = foxManuscript;

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
  outline: foxOutline,
  probes: [
    [0.045, -0.6, 0],
    [-0.03, -0.84, 0],
    [0.15, -0.13, 0],
    [0.53, 0.16, 0],
  ],
  colors: ["apricot", "apricot", "orange", "orange"],
});
