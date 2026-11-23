import { englishPath } from "./navigation";

export const foxInfo = {
  id: "fox-face",
  title: "Fox face",
  summary: "Turn back two pointed ears and lift one loose tip to give a fox its two-tone muzzle.",
  availability: "playable",
  level: "Beginner",
  paper: "Square sheet",
  stepCount: 6,
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
  stepCount: 12,
  href: englishPath("paperHeart"),
  format: "Playable lesson",
} as const;

export const airplaneInfo = {
  id: "paper-airplane",
  title: "Dart paper airplane",
  summary: "Turn a portrait rectangle into a pointed dart with two swept wings and a narrow body.",
  availability: "playable",
  level: "Beginner",
  stepCount: 9,
  href: englishPath("paperAirplane"),
  paper: "2 × 3 rectangle",
  format: "Playable lesson",
} as const;

// Lightweight catalog metadata keeps fold construction out of the homepage bundle.
export const lessons = [airplaneInfo, heartInfo, foxInfo] as const;

export const studioResources = [
  {
    id: "first-fold",
    title: "The first fold",
    summary:
      "Bring two edges together around a single valley crease. Turn the sheet to see how the moving half rises and settles.",
    href: englishPath("firstFold"),
    format: "Interactive demonstration",
  },
  {
    id: "crease-guide",
    title: "Crease notation",
    summary: "Read the lines on the page. See how a valley differs from a mountain fold.",
    href: englishPath("creaseGuide"),
    format: "Field guide",
  },
] as const;
