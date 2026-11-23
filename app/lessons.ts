import { englishPath } from "./navigation";

type PublishedLesson = { id: string; title: string; summary: string; href: string; format: string };

export const airplaneInfo = {
  id: "paper-airplane",
  title: "Dart paper airplane",
  summary: "Turn a portrait rectangle into a pointed dart with two swept wings and a narrow body.",
  availability: "playable",
  level: "Beginner",
  href: englishPath("paperAirplane"),
  format: "Playable lesson",
} as const;

export const lessons = [
  airplaneInfo,
  {
    id: "first-fold",
    title: "The first fold",
    summary:
      "Bring two edges together around a single valley crease. Turn the sheet to see how the moving half rises and settles.",
    href: englishPath("firstFold"),
    format: "Interactive demonstration",
  },
] as const satisfies readonly PublishedLesson[];
