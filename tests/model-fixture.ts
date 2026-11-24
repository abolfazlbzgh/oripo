import { readFileSync } from "node:fs";
import { compileLesson } from "../app/lesson/geometry";
import type { LessonPackage } from "../app/lesson/package";

export function fixture(id: string, dir = `models/${id}`) {
  const pkg: LessonPackage = JSON.parse(readFileSync(`${dir}/lesson.json`, "utf8"));
  return { ...pkg, model: compileLesson(pkg.pattern) };
}
