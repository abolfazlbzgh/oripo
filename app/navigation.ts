import { site } from "./site";

export const pages = {
  foundation: "",
  creaseGuide: "guide/crease-notation",
  firstFold: "lab/first-fold",
} as const;

export function englishPath(page: keyof typeof pages) {
  const segment = pages[page];
  const base = `/${site.defaultLocale}`;
  return segment ? `${base}/${segment}` : base;
}

export const publishedPaths = [
  "/",
  englishPath("foundation"),
  englishPath("creaseGuide"),
  englishPath("firstFold"),
];
