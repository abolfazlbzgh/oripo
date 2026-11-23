import type { PaperPalette } from "./paper-palette";
import { diamond, flatPattern, type FlatFold } from "./flat-pattern";
import { compileLesson } from "./geometry";
import { createLessonMount } from "./lesson-scene.client";

export function mountFlatLesson(id: string, folds: readonly FlatFold[], finished: PaperPalette) {
  const model = compileLesson(flatPattern(id, diamond, folds));
  return createLessonMount(
    model,
    finished,
    {
      position: [0, -0.75, 3.4],
      minDistance: 2.3,
      maxDistance: 6,
      inspectBack: true,
      shadowZ: -0.4,
    },
    Object.fromEntries(folds.map((fold) => [fold.id, fold.hingePly])),
  );
}
