import masuText from "./en/masu-box.json";
import mapText from "./en/herringbone-map.json";
import type { Locale } from "./locales";
import type { Common, Transcript } from "./messages";
import { airplaneText, sheetText } from "../lesson/airplane.en";
import { heartText, heartSheet } from "../lesson/heart.en";
import { foxText, foxSheet } from "../lesson/fox.en";

type ModelId = keyof Common["models"];

const commonFiles = import.meta.glob<Common>("./*/common.json", { import: "default" });
const lessonFiles = import.meta.glob<Transcript>(["./*/*.json", "!./*/common.json"], {
  import: "default",
});
const english = {
  "herringbone-map": mapText,
  "masu-box": masuText,
  "paper-airplane": { sheet: sheetText, steps: airplaneText },
  "paper-heart": { sheet: heartSheet, steps: heartText },
  "fox-face": { sheet: foxSheet, steps: foxText },
} satisfies Record<ModelId, Transcript>;

export function readCommon(locale: Locale) {
  const read = commonFiles[`./${locale}/common.json`];
  if (!read) throw new Error(`Missing messages for ${locale}`);
  return read();
}
export async function readTranscript(locale: Locale, model: ModelId): Promise<Transcript> {
  if (locale === "en") return english[model];
  const read = lessonFiles[`./${locale}/${model}.json`];
  if (!read) throw new Error(`Missing transcript for ${locale}/${model}`);
  return read();
}
