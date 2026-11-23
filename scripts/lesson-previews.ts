import { masu, masuHingePlies } from "../app/lesson/masu";
import type { CompiledLesson } from "../app/lesson/geometry";
import type { HingePlies } from "../app/lesson/drawing";
import type { Point } from "../app/fold/geometry";
import { airplane, airplaneHingePlies } from "../app/lesson/airplane";
import { compileLesson } from "../app/lesson/geometry";
import { diamond, flatPattern, type FlatFold } from "../app/lesson/flat-pattern";
import { heartFolds } from "../app/lesson/heart";
import { foxFolds } from "../app/lesson/fox";
import { type ModelId, lessons } from "../app/lessons";
import { projectPaper } from "./paper-preview";

function flat(id: ModelId, folds: readonly FlatFold[]) {
  return {
    model: compileLesson(flatPattern(id, diamond, folds)),
    heights: Object.fromEntries(folds.map((f) => [f.id, f.hingePly])),
    eye: [0, -0.18, 1] as Point,
  };
}
const previews = {
  "masu-box": () => ({ model: masu, heights: masuHingePlies, eye: [2, -3, 3] as Point }),
  "paper-airplane": () => ({
    model: airplane,
    heights: airplaneHingePlies,
    eye: [2.4, -3.35, 4] as Point,
  }),
  "paper-heart": () => flat("paper-heart", heartFolds),
  "fox-face": () => flat("fox-face", foxFolds),
} satisfies Record<ModelId, () => { model: CompiledLesson; heights: HingePlies; eye: Point }>;

export function lessonPreviews() {
  return new Map(
    lessons.map((lesson) => {
      const { model, heights, eye } = previews[lesson.id]();
      return [
        "/previews/" + lesson.id + ".png",
        projectPaper(model, heights, lesson.finishedAppearance, eye),
      ];
    }),
  );
}
