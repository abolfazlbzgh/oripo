import { readFileSync } from "node:fs";
import { lessons } from "../app/lessons";
import type { LessonPackage } from "../app/lesson/package";
import { compileLesson } from "../app/lesson/geometry";
import { projectPaper } from "./paper-preview";

export function lessonPreviews() {
  return new Map(
    lessons.map(({ id }) => {
      const data: LessonPackage = JSON.parse(readFileSync(`models/${id}/lesson.json`, "utf8"));
      const { previewEye, hingePlies, plyThickness } = data.presentation;
      return [
        "/previews/" + id + ".png",
        projectPaper(
          compileLesson(data.pattern),
          hingePlies,
          data.finishedAppearance,
          previewEye,
          plyThickness,
        ),
      ];
    }),
  );
}
