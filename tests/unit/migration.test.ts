import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import baseline from "../fixtures/phase8c.json";
import { lessons, type ModelId } from "../../app/lessons";
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
it("retains the Phase 8C localized route set in its original order", () =>
  expect(sha(prerenderPaths)).toBe(baseline.paths));
it.each(Object.entries(baseline.models))(
  "%s matches the independently captured Phase 8C inputs, poses, drawing and PNG",
  async (slug, expected) => {
    const id = slug as ModelId;
    const info = lessons.find((l) => l.id === id),
      { pattern, presentation } = await loadPackage(id);
    const model = compileLesson(pattern),
      layers = paperLayers(model, presentation.hingePlies, presentation.plyThickness);
    const transcripts: Record<string, unknown> = {},
      names: Record<string, unknown> = {};
    for (const locale of localeCodes) {
      transcripts[locale] = await readTranscript(locale, id);
      names[locale] = (await readCommon(locale)).models[id];
    }
    const samples = model.steps.map((_, i) =>
      baseline.fractions.map((p) => ({
        material: poseAt(model, i, p),
        offsets: layers.foldOffsets(atIndex(layers.offsets, i), i, p),
      })),
    );
    const png = images.get("/previews/" + id + ".png");
    if (!png) throw Error("Missing preview for " + id);
    expect({
      pattern: sha(pattern),
      presentation: sha(presentation),
      catalog: sha(info),
      transcripts: sha(transcripts),
      names: sha(names),
      poses: digest(
        JSON.stringify(samples, (_, v) => (typeof v === "number" ? Math.round(v * 1e9) : v)),
      ),
      preview: digest(png),
    }).toEqual(expected);
  },
);
