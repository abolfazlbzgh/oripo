import type { FlatFold } from "./flat-pattern";
import type { PlayerLesson } from "./use-lesson-player";

export function flatPlayer<Id extends string>(
  lessonId: string,
  folds: readonly (FlatFold & { id: Id })[],
  sheet: PlayerLesson["sheet"],
  copy: Record<Id, PlayerLesson["sheet"]>,
): PlayerLesson {
  return {
    sheet,
    steps: folds.map(({ id, durationMs }) => ({ id, durationMs, ...copy[id] })),
    loadScene: () =>
      import("./flat-scene.client").then(({ mountFlatLesson }) => mountFlatLesson(lessonId, folds)),
  };
}
