import { iris, irisEye, irisHinges } from "./iris";
import { irisInfo } from "../lessons";
import { createLessonMount } from "./lesson-scene.client";
export const mountIris = createLessonMount(
  iris,
  irisInfo.finishedAppearance,
  { position: [...irisEye], minDistance: 2, maxDistance: 8, inspectBack: true, shadowZ: -1.65 },
  irisHinges,
);
