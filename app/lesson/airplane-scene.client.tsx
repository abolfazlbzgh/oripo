import { airplane } from "./airplane";
import { createLessonMount } from "./lesson-scene.client";

export const mountAirplane = createLessonMount(
  airplane,
  { position: [2.4, -3.35, 4], minDistance: 3.9, maxDistance: 8 },
  {
    "mark-spine": 0.5,
    "open-sheet": 0.5,
    "left-corner": 0.5,
    "right-corner": 0.5,
    "left-taper": 1.5,
    "right-taper": 1.5,
    "close-body": 4,
    "left-wing": 0,
    "right-wing": 0,
  },
);
