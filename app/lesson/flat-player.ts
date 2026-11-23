import type { FlatFold } from "./flat-pattern";

export function flatScene(lessonId: string, folds: readonly FlatFold[]) {
  return () =>
    import("./flat-scene.client").then(({ mountFlatLesson }) => mountFlatLesson(lessonId, folds));
}
