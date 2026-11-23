export const locales = {
  en: { name: "English", dir: "ltr", font: "latin" },
  fa: { name: "فارسی", dir: "rtl", font: "fa" },
  es: { name: "Español", dir: "ltr", font: "latin" },
  fr: { name: "Français", dir: "ltr", font: "latin" },
  "zh-Hans": { name: "简体中文", dir: "ltr", font: "zh" },
  ar: { name: "العربية", dir: "rtl", font: "ar" },
  "pt-BR": { name: "Português (Brasil)", dir: "ltr", font: "latin" },
  de: { name: "Deutsch", dir: "ltr", font: "latin" },
  ja: { name: "日本語", dir: "ltr", font: "ja" },
  hi: { name: "हिन्दी", dir: "ltr", font: "hi" },
} as const;

export type Locale = keyof typeof locales;
// Registry membership means all public pages have a complete draft.
export const localeCodes = Object.keys(locales) as Locale[];
export function isLocale(value: string): value is Locale {
  return Object.hasOwn(locales, value);
}
