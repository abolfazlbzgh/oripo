import { isLocale, localeCodes, type Locale } from "./i18n/locales";
import { lessons, type ModelId } from "./lessons";

export const labPath = "/en/lab/first-fold";
export type PublicPage = "foundation" | "creaseGuide" | ModelId;
export const publicPages: PublicPage[] = [
  "foundation",
  "creaseGuide",
  ...lessons.map(({ id }) => id),
];

export function localPath(locale: Locale, page: PublicPage = "foundation") {
  if (page === "foundation") return `/${locale}`;
  return `/${locale}/${page === "creaseGuide" ? "guide/crease-notation" : "lessons/" + page}`;
}
export function galleryPath(locale: Locale) {
  return localPath(locale) + "#models";
}

export function identifyPath(pathname: string) {
  if (pathname === "/") return { locale: "en" as const, page: "foundation" as PublicPage };
  const path = pathname.replace(/\/$/, "");
  const code = path.split("/")[1] ?? "";
  if (!isLocale(code)) return undefined;
  if (path === labPath) return { locale: code, page: "firstFold" as const };
  const page = publicPages.find((page) => localPath(code, page) === path);
  return page ? { locale: code, page } : undefined;
}

export const canonicalPaths = localeCodes.flatMap((code) =>
  publicPages.map((page) => localPath(code, page)),
);
export const publishedPaths = ["/", ...canonicalPaths];
export const prerenderPaths = [...publishedPaths, labPath];
