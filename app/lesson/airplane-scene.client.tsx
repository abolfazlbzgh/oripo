import { airplaneInfo } from "../lessons";
import { airplane, airplaneHingePlies } from "./airplane";
import { createLessonMount } from "./lesson-scene.client";

export const mountAirplane = createLessonMount(
  airplane,
  airplaneInfo.finishedAppearance,
  { position: [2.4, -3.35, 4], minDistance: 3.9, maxDistance: 8 },
  airplaneHingePlies,
);
