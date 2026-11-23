import { frogInfo } from "../lessons";
import { frog, frogHingePlies, frogEye, frogPlyThickness } from "./frog";
import { createLessonMount } from "./lesson-scene.client";
export const mountFrog = createLessonMount(
  frog,
  frogInfo.finishedAppearance,
  { position: [...frogEye], minDistance: 1.1, maxDistance: 6, inspectBack: true, shadowZ: -0.68 },
  frogHingePlies,
  frogPlyThickness,
);
