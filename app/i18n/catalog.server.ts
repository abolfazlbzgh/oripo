import type { Locale } from "./locales";
import type { Common, Transcript } from "./messages";
import type { ModelId } from "../lessons";

const commonFiles = import.meta.glob<Common>("./*/common.json", { import: "default" });
const lessonFiles = import.meta.glob<Transcript>(["./*/*.json", "!./*/common.json"], {
  import: "default",
});
export function readCommon(locale: Locale) {
  const read = commonFiles[`./${locale}/common.json`];
  if (!read) throw Error("Missing messages for " + locale);
  return read();
}
export function readTranscript(locale: Locale, model: ModelId) {
  const read = lessonFiles[`./${locale}/${model}.json`];
  if (!read) throw Error(`Missing transcript for ${locale}/${model}`);
  return read();
}
