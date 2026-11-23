import { expect, it } from "vitest";
import { localeCodes } from "../../app/i18n/locales";
import { readCommon, readTranscript } from "../../app/i18n/catalog.server";
import { lessons } from "../../app/lessons";

function leaves(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid dictionary node: " + prefix);
  return Object.assign(
    {},
    ...Object.entries(value).map(([key, child]) => leaves(child, prefix + "." + key)),
  );
}
function compare(source: unknown, translation: unknown) {
  const a = leaves(source),
    b = leaves(translation);
  expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  for (const [key, text] of Object.entries(b)) {
    expect(text.trim(), key).not.toBe("");
    expect(text, key).not.toMatch(/\bTODO\b|[Ll]orem ipsum/);
    const tokens = (v: string) => (v.match(/\{\w+\}/g) ?? []).sort();
    expect(tokens(text), key).toEqual(tokens(a[key] ?? ""));
    expect(text.replace(/\{\w+\}/g, ""), key).not.toMatch(/[{}]/);
  }
}
it.each(localeCodes)(
  "%s contains all interface text and the complete authored transcripts",
  async (locale) => {
    compare(await readCommon("en"), await readCommon(locale));
    for (const { id, stepCount } of lessons) {
      const english = await readTranscript("en", id),
        translated = await readTranscript(locale, id);
      compare(english, translated);
      expect(Object.keys(translated.steps)).toHaveLength(stepCount);
      if (locale !== "en")
        for (const [key, step] of Object.entries(translated.steps)) {
          expect(step.instruction, key).not.toBe(english.steps[key]?.instruction);
          expect(step.result, key).not.toBe(english.steps[key]?.result);
        }
    }
  },
);
