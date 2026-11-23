import { heartOutline } from "./finished-outlines";
import { heartFolds } from "../../app/lesson/heart";
import { heartSheet, heartText } from "../../app/lesson/heart.en";
import { flatJourney } from "./flat-journey";

// Hand-built outer rim and projected 90° paper outlines from ADR 0004.
flatJourney({
  slug: "paper-heart",
  title: "Paper heart",
  steps: heartFolds,
  sheet: heartSheet,
  copy: heartText,
  middles: {
    1: [
      [
        [0, 1, 0],
        [-1, 0, 0],
        [0, -1, 0],
      ],
      [
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
      ],
    ],
    6: [
      [
        [-0.75, -0.25, 0],
        [0.75, -0.25, 0],
        [1, 0, 0],
        [0.5, 0.5, 0],
        [-0.5, 0.5, 0],
        [-1, 0, 0],
      ],
      [
        [-0.75, -0.25, 0],
        [0.75, -0.25, 0],
        [0, -0.25, 0.75],
      ],
    ],
  },
  outline: heartOutline,
  probes: [
    [0.24, 0.57, 0],
    [-0.24, 0.57, 0],
    [0.05, -0.1, 0],
  ],
  colors: ["rose", "rose", "rose"],
});
