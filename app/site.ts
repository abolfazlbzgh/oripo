export const site = {
  name: "Oripo",
  description:
    "Fold a dart paper airplane, paper heart or fox face from one sheet. Follow each fold in 3D and reverse it in the Oripo studio.",
  defaultLocale: "en",
} as const;

export function pageTitle(page: string) {
  return `${page} · ${site.name}`;
}
