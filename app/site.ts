export const site = {
  name: "Oripo",
  description:
    "Fold a dart paper airplane step by step in the Oripo 3D studio, try a single valley fold, or explore crease notation.",
  defaultLocale: "en",
} as const;

export function pageTitle(page: string) {
  return `${page} · ${site.name}`;
}
