import { mapInfo } from "../lessons";
import { herringbone, mapHingePlies, mapEye } from "./herringbone";
import { createLessonMount } from "./lesson-scene.client";
export const mountMap = createLessonMount(
  herringbone,
  mapInfo.finishedAppearance,
  { position: [...mapEye], minDistance: 2, maxDistance: 8, inspectBack: true, shadowZ: -1.65 },
  mapHingePlies,
);
