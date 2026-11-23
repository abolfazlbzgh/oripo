// Keep the public catalog independent of fold construction and localized text.
export const airplaneInfo = {
  id: "paper-airplane",
  availability: "playable",
  stepCount: 9,
  paper: "rectangle",
} as const;
export const heartInfo = {
  id: "paper-heart",
  availability: "playable",
  stepCount: 12,
  paper: "square",
} as const;
export const foxInfo = {
  id: "fox-face",
  availability: "playable",
  stepCount: 6,
  paper: "square",
} as const;
export const lessons = [airplaneInfo, heartInfo, foxInfo] as const;
export type ModelId = (typeof lessons)[number]["id"];
