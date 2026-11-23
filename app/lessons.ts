// Public metadata is sufficient for Explore, navigation and static routes.
import type { PaperPalette } from "./lesson/paper-palette";

export const difficultyOrder = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof difficultyOrder)[number];
type LessonInfo = {
  id: string;
  availability: "playable";
  stepCount: number;
  paper: "rectangle" | "square";
  category: string;
  difficulty: Difficulty;
  finishedAppearance: PaperPalette;
};

export const airplaneInfo = {
  id: "paper-airplane",
  availability: "playable",
  stepCount: 9,
  paper: "rectangle",
  category: "vehicle",
  difficulty: "beginner",
  finishedAppearance: { front: "#bdcfdf", reverse: "#90abc6", edge: "#49647e" },
} as const satisfies LessonInfo;
export const heartInfo = {
  id: "paper-heart",
  availability: "playable",
  stepCount: 12,
  paper: "square",
  category: "symbol",
  difficulty: "beginner",
  finishedAppearance: { front: "#b82d50", reverse: "#d63f60", edge: "#771d3a" },
} as const satisfies LessonInfo;
export const foxInfo = {
  id: "fox-face",
  availability: "playable",
  stepCount: 6,
  paper: "square",
  category: "animal",
  difficulty: "beginner",
  finishedAppearance: { front: "#efb797", reverse: "#d5712e", edge: "#814521" },
} as const satisfies LessonInfo;

export const lessons = [airplaneInfo, heartInfo, foxInfo] as const;
export type ModelId = (typeof lessons)[number]["id"];

export function groupByDifficulty<T extends { difficulty: Difficulty }>(entries: readonly T[]) {
  return difficultyOrder
    .map((difficulty) => ({
      difficulty,
      entries: entries.filter((entry) => entry.difficulty === difficulty),
    }))
    .filter((group) => group.entries.length > 0);
}
