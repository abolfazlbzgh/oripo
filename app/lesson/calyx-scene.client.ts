import { calyx, calyxEye, calyxHinges } from "./calyx";
import { calyxInfo } from "../lessons";
import { createLessonMount } from "./lesson-scene.client";
export const mountCalyx = createLessonMount(
  calyx,
  calyxInfo.finishedAppearance,
  { position: [...calyxEye], minDistance: 2, maxDistance: 8, inspectBack: true, shadowZ: -1.65 },
  calyxHinges,
);
