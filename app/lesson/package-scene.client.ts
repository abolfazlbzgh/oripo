import type { ModelId } from "../lessons";
import { compileLesson } from "./geometry";
import { createLessonMount } from "./lesson-scene.client";
import { loadPackage } from "./load-package";

export async function loadLessonMount(id: ModelId) {
  const { pattern, finishedAppearance, presentation } = await loadPackage(id);
  return createLessonMount(
    compileLesson(pattern),
    finishedAppearance,
    presentation.view,
    presentation.hingePlies,
    presentation.plyThickness,
    presentation.camera,
  );
}
