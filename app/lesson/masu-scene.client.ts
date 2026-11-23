import { masuInfo } from "../lessons";
import { masu, masuHingePlies } from "./masu";
import { createLessonMount } from "./lesson-scene.client";
export const mountMasu = createLessonMount(
  masu,
  masuInfo.finishedAppearance,
  {
    position: [2.3, -3.4, 4.8],
    minDistance: 2.1,
    maxDistance: 9,
    inspectBack: true,
    shadowZ: -0.12,
  },
  masuHingePlies,
);
