import type { PaperPalette } from "./paper-palette";
import type { FlatFold } from "./flat-pattern";

export function flatScene(lessonId: string, folds: readonly FlatFold[], finished: PaperPalette) {
  return () =>
    import("./flat-scene.client").then(({ mountFlatLesson }) =>
      mountFlatLesson(lessonId, folds, finished),
    );
}
