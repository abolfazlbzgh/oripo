import { tern, ternEye, ternHinges } from "./tern";
import { ternInfo } from "../lessons";
import { createLessonMount } from "./lesson-scene.client";
export const mountTern = createLessonMount(
  tern,
  ternInfo.finishedAppearance,
  { position: [...ternEye], minDistance: 2, maxDistance: 8, inspectBack: true, shadowZ: -1.65 },
  ternHinges,
);
