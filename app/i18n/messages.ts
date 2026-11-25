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

// Keep the Arabic digits of the published Node prerender on browsers whose ICU
// data defaults the same language tag to a different numbering system.
export function numberLocale(locale: Locale) {
  return locale === "ar" ? "ar-u-nu-latn" : locale;
}

export function formatter(locale: Locale) {
  const numbers = new Intl.NumberFormat(numberLocale(locale), { useGrouping: false });
  return (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, key: string) => {
      const value = values[key];
      if (value === undefined) throw new Error(`Missing interpolation {${key}}`);
      return typeof value === "number" ? numbers.format(value) : value;
    });
}
