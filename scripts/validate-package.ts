import {
  atIndex,
  compileLesson,
  difference,
  tolerance,
  type CompiledLesson,
} from "../app/lesson/geometry";
import { prepareChart, type Chart, type RigidField } from "../app/lesson/rigid-field";
import { validateViews } from "../app/lesson/camera";
import { paperLayers } from "../app/lesson/drawing";
import {
  resolvePresentation,
  type AuthoredLessonPackage,
  type LessonPackage,
} from "../app/lesson/package";
import { describeStock, exportFold } from "./fold";
import { checkShape, packageShape } from "./schema-validation";

// Centroid-classified fields assume each convex panel lies in a single rigid region.
// Sample towards each corner from inside the face, so a vertex on a scored hinge
// belongs to this face's side. Explicit packet fields have their own sector checks.
function validateFieldPanels(pkg: LessonPackage, model: CompiledLesson) {
  const axes = ["x", "y", "origin"] as const;
  for (const [i, step] of pkg.pattern.steps.entries()) {
    if (!step.field && !step.regions) continue;
    const assigned = new Map<string, RigidField>();
    for (const region of step.regions ?? [])
      for (const face of region.faces) assigned.set(face, region.field);
    const start = atIndex(model.poses, i);
    for (const [f, face] of model.faces.entries()) {
      const field = step.field ?? assigned.get(face.id);
      if (
        !field ||
        field.kind === "tray-corner" ||
        field.kind === "boat-pocket" ||
        field.kind === "pocket-squash"
      )
        continue;
      const corners = face.vertices.map((v) => atIndex(start, v));
      const cx = corners.reduce((sum, p) => sum + p[0], 0) / corners.length;
      const cy = corners.reduce((sum, p) => sum + p[1], 0) / corners.length;
      const reference = atIndex(atIndex(model.steps, i).charts ?? [], f)(0.5);
      for (const [x, y] of corners) {
        let local: Chart;
        try {
          local = prepareChart(field, x + (cx - x) * 1e-6, y + (cy - y) * 1e-6)(0.5);
        } catch (error) {
          throw Error(step.id + "/" + face.id + "/" + field.kind + ": " + String(error), {
            cause: error,
          });
        }
        if (
          axes.some((axis) => Math.hypot(...difference(local[axis], reference[axis])) > tolerance)
        )
          throw Error(
            step.id +
              "/" +
              face.id +
              ": score the panel along the " +
              field.kind +
              " region boundary",
          );
      }
    }
  }
}
export function validatePackage(input: unknown, slug: string): LessonPackage {
  checkShape(packageShape, input, slug);
  try {
    const pkg = resolvePresentation(input as AuthoredLessonPackage);
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
      ![p.view.minDistance, p.view.maxDistance, distance, Math.hypot(...p.previewEye)].every(
        Number.isFinite,
      ) ||
      !Math.hypot(...p.previewEye) ||
      distance < p.view.minDistance ||
      distance > p.view.maxDistance ||
      p.view.minDistance >= p.view.maxDistance
    )
      throw Error("presentation: invalid viewing direction or camera range");
    validateViews(pattern.steps, p.view, p.camera);
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
    if (model) {
      validateFieldPanels(pkg, model);
      paperLayers(model, p.hingePlies, p.plyThickness);
    }
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
