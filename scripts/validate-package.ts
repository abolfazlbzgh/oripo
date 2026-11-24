import { compileLesson, tolerance } from "../app/lesson/geometry";
import { paperLayers } from "../app/lesson/drawing";
import type { LessonPackage } from "../app/lesson/package";
import { describeStock, exportFold } from "./fold";
import { checkShape, packageShape } from "./schema-validation";

export function validatePackage(input: unknown, slug: string): LessonPackage {
  checkShape(packageShape, input, slug);
  const pkg = input as LessonPackage;
  try {
    const { pattern, presentation: p } = pkg;
    if (pattern.lessonId !== slug || pkg.manuscript !== slug)
      throw Error("pattern.lessonId and manuscript must match the directory ID");
    if (
      pkg.status === "published" &&
      (!pattern.steps.length || !pkg.difficulty || pkg.provenance.rightsStatus === "unverified")
    )
      throw Error("Publication requires actions, a maker tier and documented rights");
    const stock = describeStock(pattern.sheet);
    if (
      stock.shape !== pkg.paper.shape ||
      stock.span.some((x, i) => Math.abs(x - (pkg.paper.span[i] ?? 0)) > tolerance)
    )
      throw Error("paper.shape/span disagree with material coordinates");
    if (pkg.fold) exportFold({ sheet: pattern.sheet, fold: pkg.fold });
    const distance = Math.hypot(...p.view.position);
    if (
      !Math.hypot(...p.previewEye) ||
      distance < p.view.minDistance ||
      distance > p.view.maxDistance ||
      p.view.minDistance >= p.view.maxDistance
    )
      throw Error("presentation: invalid viewing direction or camera range");
    const model = pattern.steps.length ? compileLesson(pattern) : undefined;
    for (const [id, settings] of Object.entries(p.hingePlies)) {
      const step = pattern.steps.find((s) => s.id === id);
      if (!step?.turns.length)
        throw Error("presentation.hingePlies/" + id + " does not name a turn step");
      if (typeof settings === "object" && !Array.isArray(settings))
        for (const key of Object.keys(settings))
          if (!step.turns.some((t) => t.crease === key))
            throw Error(
              "presentation.hingePlies/" + id + "/" + key + " does not name a moving hinge",
            );
    }
    if (model) paperLayers(model, p.hingePlies, p.plyThickness);
    return pkg;
  } catch (error) {
    throw Error(slug + ": " + (error instanceof Error ? error.message : String(error)), {
      cause: error,
    });
  }
}
function record(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error(path + " must be an object");
  const obj = value as Record<string, unknown>;
  for (const key of keys)
    if (!Object.hasOwn(obj, key)) throw Error(path + "/" + key + " is missing");
  for (const key of Object.keys(obj))
    if (!keys.includes(key)) throw Error(path + "/" + key + " is unknown");
  return obj;
}
function strings(value: unknown, keys: string[], path: string) {
  for (const [key, text] of Object.entries(record(value, keys, path)))
    if (typeof text !== "string" || !text.trim()) throw Error(path + "/" + key + " requires text");
}
export const validateModelName = (value: unknown, path: string) =>
  strings(value, ["title", "short", "summary"], path);
export function validateManuscript(value: unknown, pkg: LessonPackage, locale: string) {
  const path = locale + "/" + pkg.manuscript,
    data = record(value, ["sheet", "steps"], path);
  const keys = ["title", "instruction", "result"];
  strings(data.sheet, keys, path + "/sheet");
  const steps = record(
    data.steps,
    pkg.pattern.steps.map((s) => s.id),
    path + "/steps",
  );
  for (const [id, copy] of Object.entries(steps)) strings(copy, keys, path + "/steps/" + id);
}
