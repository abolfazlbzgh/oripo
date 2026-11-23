import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "../../app/i18n/locales";
import type { Common, Transcript } from "../../app/i18n/messages";
import type { ModelId } from "../../app/lessons";

export function readCopy(locale: Locale, file: "common"): Common;
export function readCopy(locale: Locale, file: ModelId): Transcript;
export function readCopy(locale: Locale, file: string) {
  return JSON.parse(readFileSync(join("app", "i18n", locale, file + ".json"), "utf8"));
}
