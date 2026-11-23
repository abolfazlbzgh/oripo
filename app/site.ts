export const site = {
  name: "Oripo",
  description: "A step-by-step guide to learning origami with authored 3D folds.",
  defaultLocale: "en",
} as const;

export function pageTitle(page: string) {
  return `${page} · ${site.name}`;
}
