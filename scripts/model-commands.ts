import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { format } from "prettier";
import { compileLesson } from "../app/lesson/geometry";
import { resolvePresentation, type LessonPackage } from "../app/lesson/package";
import { checkCatalog, readJson } from "./model-catalog";
import { describeStock, exportFold, importFold, type Material } from "./fold";
import { validatePackage } from "./validate-package";
import { projectPaper } from "./paper-preview";

const template: Material = {
  sheet: {
    vertices: { a: [-1, -1, 0], b: [1, -1, 0], c: [1, 1, 0], d: [-1, 1, 0] },
    faces: [
      { id: "lower", vertices: ["a", "b", "c"] },
      { id: "upper", vertices: ["a", "c", "d"] },
    ],
    creases: { diagonal: ["a", "c"] },
  },
};
export function makeDraft(id: string, material?: Material): LessonPackage {
  const { sheet, fold } = material ?? template;
  const paper = describeStock(sheet);
  return resolvePresentation({
    schemaVersion: 1,
    status: "draft",
    order: 0,
    difficulty: null,
    category: "unclassified",
    paper,
    finishedAppearance: { front: "#798faf", reverse: "#9eb2cb", edge: "#455d78" },
    manuscript: id,
    provenance: {
      variant: id,
      reference: "Awaiting construction reference",
      rights: "Awaiting rights review",
      rightsStatus: "unverified",
      review: { maker: "provisional", language: "pending", physical: "pending", visual: "pending" },
    },
    presentation: {
      hingePlies: material ? {} : { lift: 0.5 },
    },
    pattern: {
      version: 1,
      lessonId: id,
      sheet,
      steps: material
        ? []
        : [
            {
              id: "lift",
              durationMs: 900,
              turns: [{ crease: "diagonal", faces: ["upper"], degrees: 75 }],
            },
          ],
    },
    ...(fold ? { fold } : {}),
  });
}
export async function run(args: string[]) {
  const [action = "check", id, path] = args;
  if ((action === "check" || action === "generate") && args.length <= 1) {
    console.log(await checkCatalog(process.cwd(), action === "generate"));
    return;
  }
  if (!id || !/^[a-z][a-z0-9-]{0,95}$/.test(id)) throw Error("Expected a stable model ID");
  const dir = join("models", id),
    file = join(dir, "lesson.json");
  if (
    (action === "new" && args.length === 2) ||
    (action === "import-fold" && path && args.length === 3)
  ) {
    const imported = action === "import-fold" && path ? importFold(readJson(path)) : undefined;
    const data = validatePackage(makeDraft(id, imported), id);
    if (existsSync(dir)) throw Error(dir + " already exists. Choose an unused ID.");
    const contents = await format(JSON.stringify(data), { parser: "json", printWidth: 100 });
    mkdirSync(dir);
    writeFileSync(file, contents, { flag: "wx" });
    console.log(file);
    return;
  }
  if (
    path &&
    ((action === "export-fold" && args.length === 3) ||
      (action === "preview" && (args.length === 3 || args.length === 4)))
  ) {
    const pkg = validatePackage(readJson(file), id);
    if (action === "export-fold")
      writeFileSync(
        path,
        JSON.stringify(exportFold({ sheet: pkg.pattern.sheet, fold: pkg.fold }), null, 2) + "\n",
        { flag: "wx" },
      );
    else {
      if (!pkg.pattern.steps.length) throw Error(id + " needs an authored motion before preview");
      const { hingePlies, previewEye, plyThickness } = pkg.presentation;
      const position = args[3] === undefined ? pkg.pattern.steps.length : Number(args[3]);
      writeFileSync(
        path,
        projectPaper(
          compileLesson(pkg.pattern),
          hingePlies,
          pkg.finishedAppearance,
          previewEye,
          plyThickness,
          position,
        ),
        { flag: "wx" },
      );
    }
    console.log(path);
    return;
  }
  throw Error(
    "Usage: models -- check | generate | new ID | import-fold ID INPUT.fold | export-fold ID OUTPUT.fold | preview ID OUTPUT.png [position]",
  );
}
