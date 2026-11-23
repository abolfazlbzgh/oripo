export const site = {
  name: "Oripo",
  description:
    "Learn how origami takes shape. Explore crease notation and turn a square sheet through a reversible fold in the Oripo 3D studio.",
  defaultLocale: "en",
} as const;

export function pageTitle(page: string) {
  return `${page} · ${site.name}`;
}
