import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import baseline from "../fixtures/phase8c.json";
import { lessons, isModelId } from "../../app/lessons";
import { fixture } from "../model-fixture";
import { publicEntries } from "../../scripts/model-catalog";
import { projectPaper } from "../../scripts/paper-preview";
import { loadPackage } from "../../app/lesson/load-package";
import { compileLesson, poseAt, atIndex } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { readCommon, readTranscript } from "../../app/i18n/catalog.server";
import { localeCodes } from "../../app/i18n/locales";
import { prerenderPaths } from "../../app/navigation";
import { lessonPreviews } from "../../scripts/lesson-previews";

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
const sha = (value: unknown) => digest(JSON.stringify(canonical(value)));
const images = lessonPreviews();
it("changes only the retired map slot in the Phase 8C route inventory", () => {
  const current = "/lessons/monarch-butterfly";
  expect(prerenderPaths.filter((p) => p.endsWith(current))).toHaveLength(localeCodes.length);
  expect(prerenderPaths.some((p) => p.endsWith("/lessons/herringbone-map"))).toBe(false);
  expect(sha(prerenderPaths.map((p) => p.replace(current, "/lessons/herringbone-map")))).toBe(
    baseline.paths,
  );
});
it.each(Object.entries(baseline.models))(
  "%s matches the independently captured Phase 8C inputs, poses, drawing and PNG",
  async (slug, expected) => {
    const archived = slug === "herringbone-map";
    if (!archived && !isModelId(slug)) throw Error("Missing original model " + slug);
    const pkg = isModelId(slug)
      ? await loadPackage(slug)
      : fixture(slug, "tests/fixtures/legacy-map");
    const { pattern, presentation } = pkg;
    const info = archived ? publicEntries([pkg])[0] : lessons.find((l) => l.id === slug);
    const model = compileLesson(pattern),
      layers = paperLayers(model, presentation.hingePlies, presentation.plyThickness);
    const transcripts: Record<string, unknown> = {},
      names: Record<string, unknown> = {};
    if (isModelId(slug)) {
      for (const locale of localeCodes) {
        transcripts[locale] = await readTranscript(locale, slug);
        names[locale] = (await readCommon(locale)).models[slug];
      }
      expect(sha(transcripts)).toBe(expected.transcripts);
      expect(sha(names)).toBe(expected.names);
    }
    const samples = model.steps.map((_, i) =>
      baseline.fractions.map((p) => ({
        material: poseAt(model, i, p),
        offsets: layers.foldOffsets(atIndex(layers.offsets, i), i, p),
      })),
    );
    const png = archived
      ? projectPaper(
          model,
          presentation.hingePlies,
          pkg.finishedAppearance,
          presentation.previewEye,
          presentation.plyThickness,
        )
      : images.get("/previews/" + slug + ".png");
    if (!png) throw Error("Missing preview for " + slug);
    expect({
      pattern: sha(pattern),
      presentation: sha(presentation),
      catalog: sha(info),
      poses: digest(
        JSON.stringify(samples, (_, v) => (typeof v === "number" ? Math.round(v * 1e9) : v)),
      ),
      preview: digest(png),
    }).toMatchObject({
      pattern: expected.pattern,
      presentation: expected.presentation,
      catalog: expected.catalog,
      poses: expected.poses,
      preview: expected.preview,
    });
  },
);
