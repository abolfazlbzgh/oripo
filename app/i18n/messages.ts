import type english from "./en/common.json";
import type { Locale } from "./locales";

export type Common = typeof english;
export type Instruction = { title: string; instruction: string; result: string };
export type Transcript = { sheet: Instruction; steps: Record<string, Instruction> };
export type SiteData = {
  locale: Locale;
  common: Common;
  transcript: Transcript | null;
  origin: string;
};

export function formatter(locale: Locale) {
  const numbers = new Intl.NumberFormat(locale, { useGrouping: false });
  return (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing interpolation {${key}}`);
      return typeof value === "number" ? numbers.format(value) : value;
    });
}
