import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import example from "../fixtures/offset-waterbomb/lesson.json";
import { validatePackage, validateManuscript } from "../../scripts/validate-package";
import { makeDraft } from "../../scripts/model-commands";
import { checkCatalog } from "../../scripts/model-catalog";
import { atIndex, compileLesson, poseAt } from "../../app/lesson/geometry";
import { paperLayers } from "../../app/lesson/drawing";
import { projectPaper } from "../../scripts/paper-preview";
import { localeCodes } from "../../app/i18n/locales";
import { identifyPath } from "../../app/navigation";
import { packageLoaders } from "../../app/lesson/package-loaders.generated";

const id = example.pattern.lessonId;
const copy = {
  title: "Test fold",
  instruction: "Close the upper packet.",
  result: "The side midpoint meets the lower rim.",
};
it("accepts an independent translated, scaled three-ply waterbomb with a known moving pin", () => {
  const p = validatePackage(example, id),
    model = compileLesson(p.pattern);
  const east = model.vertexIds.indexOf("e");
  expect(atIndex(poseAt(model, 0, 0.5), east)).toEqual([
    expect.closeTo(0.75, 12),
    expect.closeTo(-1.125, 12),
    expect.closeTo(1, 12),
  ]);
  expect(atIndex(poseAt(model, 0, 1), east)).toEqual([0.25, -1.625, 0]);
  const layers = paperLayers(model, {}).offsets[1];
  expect(layers?.some((v) => v[2] > 0.006)).toBe(true);
  expect(
    projectPaper(model, {}, p.finishedAppearance, p.presentation.previewEye)
      .subarray(1, 4)
      .toString(),
  ).toBe("PNG");
  expect(identifyPath("/en/lessons/" + id)).toBeUndefined();
  expect(packageLoaders).not.toHaveProperty(id);
});
it("discovers a new package from data, excludes drafts and detects stale generated inputs", async () => {
  const dir = mkdtempSync(join(tmpdir(), "oripo-catalog-"));
  const json = (path: string, x: unknown) => writeFileSync(join(dir, path), JSON.stringify(x));
  try {
    mkdirSync(join(dir, "models", id), { recursive: true });
    mkdirSync(join(dir, "app", "lesson"), { recursive: true });
    json("models/" + id + "/lesson.json", example);
    for (const code of localeCodes) {
      mkdirSync(join(dir, "app", "i18n", code), { recursive: true });
      json("app/i18n/" + code + "/common.json", { models: {} });
    }
    expect((await checkCatalog(dir, true)).published).toBe(0);
    const loader = join(dir, "app/lesson/package-loaders.generated.ts");
    expect(readFileSync(loader, "utf8")).not.toContain(id);
    json("models/" + id + "/lesson.json", { ...example, status: "published" });
    for (const code of localeCodes) {
      json("app/i18n/" + code + "/common.json", {
        models: { [id]: { title: "Waterbomb", short: "Base", summary: "Test packet" } },
      });
      json("app/i18n/" + code + "/" + id + ".json", { sheet: copy, steps: { collapse: copy } });
    }
    expect((await checkCatalog(dir, true)).manuscripts).toBe(10);
    expect(readFileSync(loader, "utf8")).toContain("../../models/" + id + "/lesson.json");
    await expect(checkCatalog(dir)).resolves.toMatchObject({ published: 1 });
    writeFileSync(loader, "stale");
    await expect(checkCatalog(dir)).rejects.toThrow(/stale/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
it("rejects unknown contracts, mixed motions and missing or invented author references", () => {
  const draft = makeDraft("specimen");
  const check = (p: unknown) => validatePackage(p, "specimen");
  expect(() => check({ ...draft, schemaVersion: 2 })).toThrow(/schemaVersion/);
  expect(() => check({ ...draft, status: "published" })).toThrow(/Publication/);
  expect(() => check({ ...draft, extension: "ignored" })).toThrow(/extension/);
  expect(() => check({ ...draft, manuscript: "other" })).toThrow(/manuscript/);
  expect(() => check({ ...draft, paper: { ...draft.paper, span: [5, 2] } })).toThrow(/span/);
  expect(() =>
    check({ ...draft, presentation: { ...draft.presentation, hingePlies: { typo: 1 } } }),
  ).toThrow(/hingePlies\/typo/);
  const step = atIndex(draft.pattern.steps, 0);
  const badStep = (extra: object) => ({
    ...draft,
    pattern: { ...draft.pattern, steps: [{ ...step, ...extra }] },
  });
  expect(() => check(badStep({ durationMs: Infinity }))).toThrow(/duration/);
  expect(() => check(badStep({ field: { kind: "waterbomb", center: [0, 0], radius: 1 } }))).toThrow(
    /lift.*motion family/,
  );
  expect(() => check(badStep({ field: { kind: "petal-eversion" } }))).toThrow(
    /specimen step lift field petal-eversion/,
  );
  expect(() => check(badStep({ reopenTo: 0.4, turns: [] }))).toThrow(/reopening/);
  expect(() =>
    check(badStep({ turns: [{ crease: "diagonal", degrees: 90, faces: ["missing"] }] })),
  ).toThrow(/lift.*Unknown face/);
  expect(() => validateManuscript({ sheet: copy, steps: { typo: copy } }, draft, "en")).toThrow(
    /en\/specimen\/steps\/lift/,
  );
});
