import { englishPath } from "./navigation";

type PublishedLesson = { id: string; title: string; summary: string; href: string; format: string };

export const foxInfo = {
  id: "fox-face",
  title: "Fox face",
  summary: "Turn back two pointed ears and lift one loose tip to give a fox its two-tone muzzle.",
  availability: "playable",
  level: "Beginner",
  paper: "Square sheet",
  href: englishPath("foxFace"),
  format: "Playable lesson",
} as const;

export const heartInfo = {
  id: "paper-heart",
  title: "Paper heart",
  summary: "Fold a square into two broad lobes with a center notch and a pointed base.",
  availability: "playable",
  level: "Beginner",
  paper: "Square sheet",
  href: englishPath("paperHeart"),
  format: "Playable lesson",
} as const;

export const airplaneInfo = {
  id: "paper-airplane",
  title: "Dart paper airplane",
  summary: "Turn a portrait rectangle into a pointed dart with two swept wings and a narrow body.",
  availability: "playable",
  level: "Beginner",
  href: englishPath("paperAirplane"),
  paper: "2 × 3 rectangle",
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
