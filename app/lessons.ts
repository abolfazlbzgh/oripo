// Public metadata is sufficient for Explore, navigation and static routes.
import type { PaperPalette } from "./lesson/paper-palette";

export const difficultyOrder = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof difficultyOrder)[number];
type LessonInfo = {
  id: string;
  availability: "playable";
  stepCount: number;
  paper: "rectangle" | "square" | "hexagon";
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

export const masuInfo = {
  id: "masu-box",
  availability: "playable",
  stepCount: 18,
  paper: "square",
  category: "container",
  difficulty: "intermediate",
  finishedAppearance: { front: "#448b91", reverse: "#64a5a0", edge: "#285359" },
} as const satisfies LessonInfo;

export const mapInfo = {
  id: "herringbone-map",
  availability: "playable",
  stepCount: 15,
  paper: "rectangle",
  category: "corrugation",
  difficulty: "intermediate",
  finishedAppearance: { front: "#7051a5", reverse: "#ad88cb", edge: "#453661" },
} as const satisfies LessonInfo;
export const frogInfo = {
  id: "jumping-frog",
  availability: "playable",
  stepCount: 20,
  paper: "square",
  category: "action-animal",
  difficulty: "intermediate",
  finishedAppearance: { front: "#528236", reverse: "#82a74e", edge: "#314c28" },
} as const satisfies LessonInfo;
export const calyxInfo = {
  id: "pinwheel-calyx",
  availability: "playable",
  stepCount: 8,
  paper: "square",
  category: "botanical",
  difficulty: "advanced",
  finishedAppearance: { front: "#df716b", reverse: "#f3aa91", edge: "#884452" },
} as const satisfies LessonInfo;
export const ternInfo = {
  id: "river-tern",
  availability: "playable",
  stepCount: 15,
  paper: "square",
  category: "bird",
  difficulty: "advanced",
  finishedAppearance: { front: "#4278ae", reverse: "#89b6d0", edge: "#294966" },
} as const satisfies LessonInfo;
export const irisInfo = {
  id: "hex-iris",
  availability: "playable",
  stepCount: 20,
  paper: "hexagon",
  category: "tessellation",
  difficulty: "advanced",
  finishedAppearance: { front: "#e2b52d", reverse: "#665389", edge: "#57416f" },
} as const satisfies LessonInfo;
export const lessons = [
  airplaneInfo,
  heartInfo,
  foxInfo,
  masuInfo,
  frogInfo,
  mapInfo,
  calyxInfo,
  ternInfo,
  irisInfo,
] as const;
export type ModelId = (typeof lessons)[number]["id"];

export function groupByDifficulty<T extends { difficulty: Difficulty }>(entries: readonly T[]) {
  return difficultyOrder
    .map((difficulty) => ({
      difficulty,
      entries: entries.filter((entry) => entry.difficulty === difficulty),
    }))
    .filter((group) => group.entries.length > 0);
}
