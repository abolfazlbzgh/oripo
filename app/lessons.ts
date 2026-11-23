import { englishPath } from "./navigation";

type PublishedLesson = { id: string; title: string; summary: string; href: string; format: string };

export const lessons = [
  {
    id: "first-fold",
    title: "The first fold",
    summary:
      "Bring two edges together around a single valley crease. Turn the sheet to see how the moving half rises and settles.",
    href: englishPath("firstFold"),
    format: "Interactive demonstration",
  },
] as const satisfies readonly PublishedLesson[];
